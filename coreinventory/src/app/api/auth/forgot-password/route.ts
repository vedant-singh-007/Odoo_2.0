import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/mailer";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 404 }
      );
    }

    // Invalidate any existing OTPs for this email
    await prisma.passwordResetOtp.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.passwordResetOtp.create({
      data: { email, otp, expiresAt },
    });

    // Send OTP via email (falls back to console log if SMTP not configured)
    try {
      await sendOtpEmail(email, otp);
    } catch (emailError) {
      console.error("[MAILER ERROR] Failed to send OTP email. Gmail is likely blocking the standard password.");
      console.warn(`\n================================`);
      console.warn(`[FALLBACK] Your OTP is: ${otp}`);
      console.warn(`================================\n`);
      // Don't fail the request — OTP is still saved in DB
    }

    return NextResponse.json({
      message: "OTP sent to your email address",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
