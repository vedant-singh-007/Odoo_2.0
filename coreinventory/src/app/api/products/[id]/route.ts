import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Calculate stock per location
    const internalLocations = await prisma.location.findMany({
      where: { type: "INTERNAL" },
    });

    const stockPerLocation = await Promise.all(
      internalLocations.map(async (loc) => {
        const inbound = await prisma.stockMove.aggregate({
          where: {
            productId: id,
            destLocationId: loc.id,
            operation: { status: "DONE" },
          },
          _sum: { quantity: true },
        });

        const outbound = await prisma.stockMove.aggregate({
          where: {
            productId: id,
            sourceLocationId: loc.id,
            operation: { status: "DONE" },
          },
          _sum: { quantity: true },
        });

        const stock = (inbound._sum.quantity || 0) - (outbound._sum.quantity || 0);

        return {
          locationId: loc.id,
          locationName: loc.name,
          stock,
        };
      })
    );

    const totalStock = stockPerLocation.reduce((sum, loc) => sum + loc.stock, 0);

    return NextResponse.json({
      ...product,
      totalStock,
      stockPerLocation,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, skuCode, category, unitOfMeasure, reorderLevel } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(skuCode && { skuCode }),
        ...(category && { category }),
        ...(unitOfMeasure && { unitOfMeasure }),
        ...(reorderLevel !== undefined && { reorderLevel }),
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
