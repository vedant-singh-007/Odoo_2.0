"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[hsl(var(--border))] bg-white/80 backdrop-blur-md px-6">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
          CoreInventory
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--secondary))]">
              <User className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <span className="text-sm font-medium">{session.user.name}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-[hsl(280,30%,35%)] text-white">
                {(session.user as { role?: string }).role}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"
              id="logout-button"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
