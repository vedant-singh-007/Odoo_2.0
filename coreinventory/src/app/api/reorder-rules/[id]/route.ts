import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/api-auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireManager();
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const { minQuantity, maxQuantity, reorderPoint } = body;

    const rule = await prisma.reorderRule.update({
      where: { id },
      data: {
        minQuantity: minQuantity ?? undefined,
        maxQuantity: maxQuantity ?? undefined,
        reorderPoint: reorderPoint ?? undefined,
      },
      include: {
        product: { select: { name: true, skuCode: true } },
        location: { select: { name: true, type: true } },
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Error updating reorder rule:", error);
    return NextResponse.json({ error: "Failed to update reorder rule" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireManager();
    if (error) return error;

    const { id } = await params;
    await prisma.reorderRule.delete({ where: { id } });
    return NextResponse.json({ message: "Reorder rule deleted" });
  } catch (error) {
    console.error("Error deleting reorder rule:", error);
    return NextResponse.json({ error: "Failed to delete reorder rule" }, { status: 500 });
  }
}
