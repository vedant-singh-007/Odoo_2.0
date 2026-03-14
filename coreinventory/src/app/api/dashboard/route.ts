import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Total unique products
    const totalProducts = await prisma.product.count();

    // Get all products with stock calculation
    const products = await prisma.product.findMany();
    const productStocks = await Promise.all(
      products.map(async (product) => {
        const inbound = await prisma.stockMove.aggregate({
          where: {
            productId: product.id,
            destLocation: { type: "INTERNAL" },
            operation: { status: "DONE" },
          },
          _sum: { quantity: true },
        });
        const outbound = await prisma.stockMove.aggregate({
          where: {
            productId: product.id,
            sourceLocation: { type: "INTERNAL" },
            operation: { status: "DONE" },
          },
          _sum: { quantity: true },
        });
        const stock = (inbound._sum.quantity || 0) - (outbound._sum.quantity || 0);
        return { ...product, stock };
      })
    );

    // Low stock / out of stock items
    const lowStockItems = productStocks.filter(
      (p) => p.stock <= p.reorderLevel
    );
    const outOfStockItems = productStocks.filter((p) => p.stock <= 0);

    // Pending receipts
    const pendingReceipts = await prisma.stockOperation.count({
      where: { type: "RECEIPT", status: { in: ["DRAFT", "READY"] } },
    });

    // Pending deliveries
    const pendingDeliveries = await prisma.stockOperation.count({
      where: { type: "DELIVERY", status: { in: ["DRAFT", "READY"] } },
    });

    // Scheduled transfers
    const scheduledTransfers = await prisma.stockOperation.count({
      where: { type: "TRANSFER", status: { in: ["DRAFT", "READY"] } },
    });

    // Total stock value (sum of all stock across all products)
    const totalStockUnits = productStocks.reduce((sum, p) => sum + Math.max(0, p.stock), 0);

    // Recent operations
    const recentOperations = await prisma.stockOperation.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true } },
        moves: { select: { quantity: true } },
      },
    });

    return NextResponse.json({
      totalProducts,
      totalStockUnits,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      lowStockItems: lowStockItems.map((p) => ({
        id: p.id,
        name: p.name,
        skuCode: p.skuCode,
        stock: p.stock,
        reorderLevel: p.reorderLevel,
      })),
      pendingReceipts,
      pendingDeliveries,
      scheduledTransfers,
      recentOperations: recentOperations.map((op) => ({
        id: op.id,
        type: op.type,
        status: op.status,
        reference: op.reference,
        createdBy: op.createdBy.name,
        createdAt: op.createdAt,
        itemCount: op.moves.length,
      })),
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
