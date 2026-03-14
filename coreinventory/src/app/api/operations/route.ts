import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";

    const operations = await prisma.stockOperation.findMany({
      where: {
        AND: [type ? { type } : {}, status ? { status } : {}],
      },
      include: {
        createdBy: { select: { name: true, email: true } },
        moves: {
          include: {
            product: { select: { name: true, skuCode: true } },
            sourceLocation: { select: { name: true, type: true } },
            destLocation: { select: { name: true, type: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(operations);
  } catch (error) {
    console.error("Error fetching operations:", error);
    return NextResponse.json(
      { error: "Failed to fetch operations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, reference, notes, createdById, moves } = body;

    if (!type || !createdById || !moves || moves.length === 0) {
      return NextResponse.json(
        { error: "Type, createdById, and at least one move are required" },
        { status: 400 }
      );
    }

    const operation = await prisma.stockOperation.create({
      data: {
        type,
        status: "DRAFT",
        reference,
        notes,
        createdById,
        moves: {
          create: moves.map((move: {
            productId: string;
            sourceLocationId: string;
            destLocationId: string;
            quantity: number;
          }) => ({
            productId: move.productId,
            sourceLocationId: move.sourceLocationId,
            destLocationId: move.destLocationId,
            quantity: move.quantity,
          })),
        },
      },
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

    return NextResponse.json(operation, { status: 201 });
  } catch (error) {
    console.error("Error creating operation:", error);
    return NextResponse.json(
      { error: "Failed to create operation" },
      { status: 500 }
    );
  }
}
