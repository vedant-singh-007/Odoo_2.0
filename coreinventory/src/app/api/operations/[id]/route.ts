import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;
    const operation = await prisma.stockOperation.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, email: true } },
        moves: {
          include: {
            product: true,
            sourceLocation: true,
            destLocation: true,
          },
        },
      },
    });

    if (!operation) {
      return NextResponse.json(
        { error: "Operation not found" },
        { status: 404 }
      );
    }

    // Staff cannot view RECEIPT or DELIVERY operations
    if (user.role === "STAFF" && !["TRANSFER", "ADJUSTMENT"].includes(operation.type)) {
      return NextResponse.json(
        { error: "Forbidden: insufficient permissions" },
        { status: 403 }
      );
    }

    return NextResponse.json(operation);
  } catch (error) {
    console.error("Error fetching operation:", error);
    return NextResponse.json(
      { error: "Failed to fetch operation" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    // Check the operation exists and user has permission
    const existing = await prisma.stockOperation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Operation not found" }, { status: 404 });
    }

    // Staff can only edit TRANSFER and ADJUSTMENT operations
    if (user.role === "STAFF" && !["TRANSFER", "ADJUSTMENT"].includes(existing.type)) {
      return NextResponse.json(
        { error: "Only managers can edit receipts and deliveries" },
        { status: 403 }
      );
    }

    // Cannot edit validated or cancelled operations
    if (existing.status === "DONE" || existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot edit a completed or cancelled operation" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { reference, notes, moves } = body;

    // Update operation and its moves
    const operation = await prisma.$transaction(async (tx) => {
      // Update operation fields
      const op = await tx.stockOperation.update({
        where: { id },
        data: {
          ...(reference !== undefined && { reference }),
          ...(notes !== undefined && { notes }),
        },
      });

      // If moves provided, delete old and create new
      if (moves && moves.length > 0) {
        await tx.stockMove.deleteMany({ where: { operationId: id } });
        for (const move of moves) {
          await tx.stockMove.create({
            data: {
              operationId: id,
              productId: move.productId,
              sourceLocationId: move.sourceLocationId,
              destLocationId: move.destLocationId,
              quantity: move.quantity,
            },
          });
        }
      }

      return tx.stockOperation.findUnique({
        where: { id: op.id },
        include: {
          moves: {
            include: {
              product: true,
              sourceLocation: true,
              destLocation: true,
            },
          },
        },
      });
    });

    return NextResponse.json(operation);
  } catch (error) {
    console.error("Error updating operation:", error);
    return NextResponse.json(
      { error: "Failed to update operation" },
      { status: 500 }
    );
  }
}
