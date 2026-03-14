import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the operation with moves
    const operation = await prisma.stockOperation.findUnique({
      where: { id },
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

    if (!operation) {
      return NextResponse.json(
        { error: "Operation not found" },
        { status: 404 }
      );
    }

    if (operation.status === "DONE") {
      return NextResponse.json(
        { error: "Operation is already validated" },
        { status: 400 }
      );
    }

    if (operation.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot validate a cancelled operation" },
        { status: 400 }
      );
    }

    if (operation.moves.length === 0) {
      return NextResponse.json(
        { error: "Operation has no stock moves" },
        { status: 400 }
      );
    }

    // Validate each move
    for (const move of operation.moves) {
      if (move.quantity <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity for product ${move.product.name}: quantity must be positive` },
          { status: 400 }
        );
      }

      // For DELIVERY or TRANSFER operations, check if source has enough stock
      if (
        operation.type === "DELIVERY" ||
        operation.type === "TRANSFER" ||
        (operation.type === "ADJUSTMENT" && move.sourceLocation.type === "INTERNAL")
      ) {
        if (move.sourceLocation.type === "INTERNAL") {
          // Calculate available stock at source location
          const inbound = await prisma.stockMove.aggregate({
            where: {
              productId: move.productId,
              destLocationId: move.sourceLocationId,
              operation: { status: "DONE" },
            },
            _sum: { quantity: true },
          });

          const outbound = await prisma.stockMove.aggregate({
            where: {
              productId: move.productId,
              sourceLocationId: move.sourceLocationId,
              operation: { status: "DONE" },
            },
            _sum: { quantity: true },
          });

          const availableStock =
            (inbound._sum.quantity || 0) - (outbound._sum.quantity || 0);

          if (availableStock < move.quantity) {
            return NextResponse.json(
              {
                error: `Insufficient stock for ${move.product.name} at ${move.sourceLocation.name}. Available: ${availableStock}, Requested: ${move.quantity}`,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // All validations passed — update status to DONE
    const updatedOperation = await prisma.stockOperation.update({
      where: { id },
      data: { status: "DONE" },
      include: {
        moves: {
          include: {
            product: true,
            sourceLocation: true,
            destLocation: true,
          },
        },
        createdBy: { select: { name: true } },
      },
    });

    return NextResponse.json({
      message: "Operation validated successfully",
      operation: updatedOperation,
    });
  } catch (error) {
    console.error("Error validating operation:", error);
    return NextResponse.json(
      { error: "Failed to validate operation" },
      { status: 500 }
    );
  }
}
