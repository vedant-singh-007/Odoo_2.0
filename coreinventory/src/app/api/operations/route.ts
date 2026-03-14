import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";

    // Staff can only see TRANSFER and ADJUSTMENT operations
    const typeFilter = type
      ? { type }
      : user.role === "STAFF"
        ? { type: { in: ["TRANSFER", "ADJUSTMENT"] } }
        : {};

    const operations = await prisma.stockOperation.findMany({
      where: {
        AND: [typeFilter, status ? { status } : {}],
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
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const body = await req.json();
    const { type, reference, notes, moves } = body;

    if (!type || !moves || moves.length === 0) {
      return NextResponse.json(
        { error: "Type and at least one move are required" },
        { status: 400 }
      );
    }

    // Staff can only create TRANSFER and ADJUSTMENT operations
    if (user.role === "STAFF" && !["TRANSFER", "ADJUSTMENT"].includes(type)) {
      return NextResponse.json(
        { error: "Warehouse staff can only create transfers and adjustments" },
        { status: 403 }
      );
    }

    const operation = await prisma.stockOperation.create({
      data: {
        type,
        status: "DRAFT",
        reference,
        notes,
        createdById: user.id,
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
