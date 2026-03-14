import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId") || "";
    const locationId = searchParams.get("locationId") || "";
    const operationType = searchParams.get("operationType") || "";

    const moves = await prisma.stockMove.findMany({
      where: {
        AND: [
          productId ? { productId } : {},
          locationId
            ? {
                OR: [
                  { sourceLocationId: locationId },
                  { destLocationId: locationId },
                ],
              }
            : {},
          operationType
            ? { operation: { type: operationType } }
            : {},
        ],
      },
      include: {
        product: { select: { name: true, skuCode: true } },
        sourceLocation: { select: { name: true, type: true } },
        destLocation: { select: { name: true, type: true } },
        operation: {
          select: { type: true, status: true, reference: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(moves);
  } catch (error) {
    console.error("Error fetching moves:", error);
    return NextResponse.json({ error: "Failed to fetch moves" }, { status: 500 });
  }
}
