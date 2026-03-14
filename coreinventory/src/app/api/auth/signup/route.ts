import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { loginId, email, password, role } = await req.json();

    if (!loginId || loginId.length < 6 || loginId.length > 12) {
      return NextResponse.json(
        { error: "Login ID must be between 6 and 12 characters" },
        { status: 400 }
      );
    }
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!password || password.length <= 8) {
      return NextResponse.json(
        { error: "Password must be more than 8 characters" },
        { status: 400 }
      );
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain a lowercase letter, uppercase letter, and a special character" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { loginId }
        ]
      },
    });

    if (existingUser) {
      const field = existingUser.email === email ? "Email" : "Login ID";
      return NextResponse.json(
        { error: `${field} is already in use` },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: loginId, // Map name to loginId since wireframe removed the name field
        loginId,
        email,
        passwordHash,
        role: role || "STAFF",
      },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
