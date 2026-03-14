import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const operation = await prisma.stockOperation.findUnique({ where: { id } });

    if (!operation) {
      return NextResponse.json({ error: "Operation not found" }, { status: 404 });
    }

    if (operation.status === "DONE") {
      return NextResponse.json(
        { error: "Cannot cancel a validated operation" },
        { status: 400 }
      );
    }

    const updated = await prisma.stockOperation.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ message: "Operation cancelled", operation: updated });
  } catch (error) {
    console.error("Error cancelling operation:", error);
    return NextResponse.json({ error: "Failed to cancel operation" }, { status: 500 });
  }
}
