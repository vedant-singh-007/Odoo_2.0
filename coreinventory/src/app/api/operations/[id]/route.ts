import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const { id } = await params;
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
