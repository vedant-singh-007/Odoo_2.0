import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, type } = await req.json();

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: { name, type },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 });
  }
}
