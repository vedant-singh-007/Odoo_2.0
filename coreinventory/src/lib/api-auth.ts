import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as { id: string; name: string; email: string; role: string };
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) return { user: null, error: unauthorized() };
  return { user, error: null };
}

export async function requireManager() {
  const user = await getSessionUser();
  if (!user) return { user: null, error: unauthorized() };
  if (user.role !== "MANAGER") return { user: null, error: forbidden() };
  return { user, error: null };
}
