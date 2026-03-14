"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardCheck,
  History,
  Settings,
  ChevronDown,
  ChevronRight,
  Warehouse,
  Menu,
  X,
  Repeat,
  UserCircle,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Products",
    icon: Package,
    children: [
      { label: "All Products", href: "/products", icon: Package },
      { label: "Reorder Rules", href: "/products/reorder-rules", icon: RefreshCw, roles: ["MANAGER"] },
    ],
  },
  {
    label: "Operations",
    icon: ClipboardCheck,
    children: [
      { label: "Receipts", href: "/operations/receipts", icon: ArrowDownToLine, roles: ["MANAGER"] },
      { label: "Deliveries", href: "/operations/deliveries", icon: ArrowUpFromLine, roles: ["MANAGER"] },
      { label: "Internal Transfers", href: "/operations/transfers", icon: Repeat },
      { label: "Adjustments", href: "/operations/adjustments", icon: ClipboardCheck },
    ],
  },
  {
    label: "Move History",
    href: "/moves",
    icon: History,
  },
  {
    label: "Settings",
    icon: Settings,
    roles: ["MANAGER"],
    children: [
      { label: "Warehouses & Locations", href: "/settings", icon: Warehouse, roles: ["MANAGER"] },
    ],
  },
];

function filterNavByRole(items: NavItem[], role: string): NavItem[] {
  return items
    .filter((item) => !item.roles || item.roles.includes(role))
    .map((item) => {
      if (item.children) {
        const filteredChildren = item.children.filter(
          (child) => !child.roles || child.roles.includes(role)
        );
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }
      return item;
    })
    .filter(Boolean) as NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Operations"]);

  const userRole = (session?.user as { role?: string })?.role || "STAFF";
  const visibleNav = filterNavByRole(navItems, userRole);

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-[hsl(280,30%,35%)] text-white shadow-lg"
        id="sidebar-toggle"
      >
        {collapsed ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out",
          "bg-[hsl(280,30%,35%)] text-white shadow-xl",
          collapsed ? "w-64 translate-x-0 lg:w-64" : "-translate-x-full lg:translate-x-0 lg:w-64",
          "lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">CoreInventory</h1>
            <p className="text-xs text-white/60">
              {userRole === "MANAGER" ? "Inventory Manager" : "Warehouse Staff"}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100vh-80px-120px)]">
          {visibleNav.map((item) => {
            if (item.children) {
              const isExpanded = expandedGroups.includes(item.label);
              const isChildActive = item.children.some((c) => c.href && pathname === c.href);

              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className={cn(
                      "flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isChildActive
                        ? "bg-white/15 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href!}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                            pathname === child.href
                              ? "bg-white/20 text-white font-medium"
                              : "text-white/60 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <child.icon className="h-4 w-4 shrink-0" />
                          <span>{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile section at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-3 space-y-1">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === "/profile"
                ? "bg-white/20 text-white shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <UserCircle className="h-5 w-5 shrink-0" />
            <span>My Profile</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-white/70 hover:bg-white/10 hover:text-white w-full"
            id="sidebar-logout"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setCollapsed(false)}
        />
      )}
    </>
  );
}
