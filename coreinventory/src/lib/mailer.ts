import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;

  if (!smtpConfigured) {
    console.warn(
      `[MAILER] SMTP not configured. OTP for ${email}: ${otp} (set SMTP_USER and SMTP_PASS in .env)`
    );
    return;
  }

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #faf8fc; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #4a3560, #6b4f8a); padding: 12px 16px; border-radius: 12px;">
          <span style="color: white; font-size: 24px; font-weight: bold;">📦 CoreInventory</span>
        </div>
      </div>
      <div style="background: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <h2 style="margin: 0 0 8px 0; color: #1a1a2e; font-size: 20px;">Password Reset OTP</h2>
        <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">
          You requested a password reset. Use the code below to verify your identity:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background: #f3f0f7; padding: 16px 32px; border-radius: 8px; border: 2px dashed #4a3560;">
            <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4a3560;">${otp}</span>
          </div>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin: 16px 0 0 0;">
          This code expires in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.
        </p>
      </div>
      <p style="color: #bbb; font-size: 11px; text-align: center; margin-top: 16px;">
        © ${new Date().getFullYear()} CoreInventory. All rights reserved.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"CoreInventory" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your CoreInventory Password Reset OTP",
    html,
  });
}
