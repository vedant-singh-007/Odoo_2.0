import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get("type") || "";
    const filterStatus = searchParams.get("status") || "";
    const filterWarehouse = searchParams.get("warehouse") || "";

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

    // Recent operations (with filters)
    const operationWhere: Record<string, unknown> = {};
    
    // Fix: treat "ALL" as no filter
    if (filterType && filterType !== "ALL") operationWhere.type = filterType;
    if (filterStatus && filterStatus !== "ALL") operationWhere.status = filterStatus;
    if (filterWarehouse && filterWarehouse !== "ALL") {
      operationWhere.moves = {
        some: {
          OR: [
            { sourceLocationId: filterWarehouse },
            { destLocationId: filterWarehouse },
          ],
        },
      };
    }

    // Staff should only see TRANSFER and ADJUSTMENT operations in the dashboard
    if (user.role === "STAFF") {
      operationWhere.type = operationWhere.type 
        ? operationWhere.type 
        : { in: ["TRANSFER", "ADJUSTMENT"] };
    }

    const recentOperations = await prisma.stockOperation.findMany({
      take: 20,
      where: operationWhere,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true } },
        moves: { select: { quantity: true, sourceLocation: { select: { name: true } }, destLocation: { select: { name: true } } } },
      },
    });

    // Get unique categories and locations for filter dropdowns
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ["category"],
    });

    const locations = await prisma.location.findMany({
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
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
      pendingReceipts: user.role === "MANAGER" ? pendingReceipts : undefined,
      pendingDeliveries: user.role === "MANAGER" ? pendingDeliveries : undefined,
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
      filters: {
        categories: categories.map((c) => c.category),
        locations: locations,
      },
      userRole: user.role,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
