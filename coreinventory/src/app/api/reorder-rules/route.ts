import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await requireManager();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId") || "";

    const rules = await prisma.reorderRule.findMany({
      where: productId ? { productId } : {},
      include: {
        product: { select: { name: true, skuCode: true } },
        location: { select: { name: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching reorder rules:", error);
    return NextResponse.json({ error: "Failed to fetch reorder rules" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await requireManager();
    if (error) return error;

    const body = await req.json();
    const { productId, locationId, minQuantity, maxQuantity, reorderPoint } = body;

    if (!productId || !locationId) {
      return NextResponse.json(
        { error: "Product and location are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.reorderRule.findUnique({
      where: { productId_locationId: { productId, locationId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A reorder rule for this product at this location already exists" },
        { status: 400 }
      );
    }

    const rule = await prisma.reorderRule.create({
      data: {
        productId,
        locationId,
        minQuantity: minQuantity || 0,
        maxQuantity: maxQuantity || 0,
        reorderPoint: reorderPoint || 10,
      },
      include: {
        product: { select: { name: true, skuCode: true } },
        location: { select: { name: true, type: true } },
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Error creating reorder rule:", error);
    return NextResponse.json({ error: "Failed to create reorder rule" }, { status: 500 });
  }
}
