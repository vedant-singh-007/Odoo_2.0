"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, ArrowLeft, Mail, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";

type Step = "email" | "otp" | "reset" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        if (data._demo_otp) {
          setDemoOtp(data._demo_otp);
        }
        setStep("otp");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid OTP. Please try again.");
      } else {
        setStep("reset");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        if (data.error.includes("expired") || data.error.includes("Invalid")) {
          setStep("otp");
        }
      } else {
        setStep("success");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(280,30%,95%)] via-white to-[hsl(280,20%,92%)] p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[hsl(280,30%,35%)]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[hsl(280,30%,45%)]/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 backdrop-blur-sm bg-white/90 relative">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-[hsl(280,30%,35%)] to-[hsl(280,30%,50%)] flex items-center justify-center shadow-lg">
            {step === "email" && <Mail className="h-8 w-8 text-white" />}
            {step === "otp" && <KeyRound className="h-8 w-8 text-white" />}
            {step === "reset" && <ShieldCheck className="h-8 w-8 text-white" />}
            {step === "success" && <Package className="h-8 w-8 text-white" />}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              {step === "email" && "Forgot Password"}
              {step === "otp" && "Verify OTP"}
              {step === "reset" && "Reset Password"}
              {step === "success" && "Password Reset!"}
            </CardTitle>
            <CardDescription className="text-base mt-1">
              {step === "email" && "Enter your email to receive a reset OTP"}
              {step === "otp" && `Enter the 6-digit code sent to ${email}`}
              {step === "reset" && "Create your new password"}
              {step === "success" && "Your password has been reset successfully"}
            </CardDescription>
          </div>
        </CardHeader>

        {step === "email" && (
          <form onSubmit={handleSendOtp}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-[hsl(280,30%,35%)] to-[hsl(280,30%,45%)] hover:from-[hsl(280,30%,30%)] hover:to-[hsl(280,30%,40%)] text-white font-medium shadow-md"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending OTP...
                  </div>
                ) : (
                  "Send OTP"
                )}
              </Button>
              <Link
                href="/login"
                className="flex items-center gap-1 text-sm text-[hsl(280,30%,35%)] hover:underline"
              >
                <ArrowLeft className="h-3 w-3" /> Back to Login
              </Link>
            </CardFooter>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}
              {demoOtp && (
                <div className="p-3 rounded-lg bg-[hsl(280,30%,97%)] border border-[hsl(280,30%,90%)]">
                  <p className="text-xs font-medium text-[hsl(280,30%,35%)] mb-1">Demo Mode</p>
                  <p className="text-xs text-gray-500">
                    Your OTP is: <span className="font-bold text-[hsl(280,30%,35%)]">{demoOtp}</span>
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="otp">6-Digit OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  maxLength={6}
                  className="h-11 text-center text-2xl tracking-[0.5em] font-mono"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-[hsl(280,30%,35%)] to-[hsl(280,30%,45%)] hover:from-[hsl(280,30%,30%)] hover:to-[hsl(280,30%,40%)] text-white font-medium shadow-md"
                disabled={otp.length !== 6 || loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  "Verify OTP"
                )}
              </Button>
              <button
                type="button"
                onClick={() => { setStep("email"); setError(""); setOtp(""); }}
                className="flex items-center gap-1 text-sm text-[hsl(280,30%,35%)] hover:underline"
              >
                <ArrowLeft className="h-3 w-3" /> Change email
              </button>
            </CardFooter>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-[hsl(280,30%,35%)] to-[hsl(280,30%,45%)] hover:from-[hsl(280,30%,30%)] hover:to-[hsl(280,30%,40%)] text-white font-medium shadow-md"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetting...
                  </div>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </CardFooter>
          </form>
        )}

        {step === "success" && (
          <CardContent className="pt-4">
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-gray-600">
                You can now sign in with your new password.
              </p>
              <Button
                onClick={() => router.push("/login")}
                className="w-full h-11 bg-gradient-to-r from-[hsl(280,30%,35%)] to-[hsl(280,30%,45%)] hover:from-[hsl(280,30%,30%)] hover:to-[hsl(280,30%,40%)] text-white font-medium shadow-md"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
