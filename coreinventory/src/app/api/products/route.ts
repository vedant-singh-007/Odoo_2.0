import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    const products = await prisma.product.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search } },
                  { skuCode: { contains: search } },
                ],
              }
            : {},
          category ? { category } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate stock for each product from the ledger
    const productsWithStock = await Promise.all(
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

        const totalStock =
          (inbound._sum.quantity || 0) - (outbound._sum.quantity || 0);

        return {
          ...product,
          totalStock,
        };
      })
    );

    return NextResponse.json(productsWithStock);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, skuCode, category, unitOfMeasure, reorderLevel } = body;

    if (!name || !skuCode) {
      return NextResponse.json(
        { error: "Name and SKU code are required" },
        { status: 400 }
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: { skuCode },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "Product with this SKU already exists" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        skuCode,
        category: category || "General",
        unitOfMeasure: unitOfMeasure || "Units",
        reorderLevel: reorderLevel || 10,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
