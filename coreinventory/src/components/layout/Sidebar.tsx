"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { useState } from "react";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Products",
    href: "/products",
    icon: Package,
  },
  {
    label: "Operations",
    icon: ClipboardCheck,
    children: [
      { label: "Receipts", href: "/operations/receipts", icon: ArrowDownToLine },
      { label: "Deliveries", href: "/operations/deliveries", icon: ArrowUpFromLine },
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
    href: "/settings",
    icon: Settings,
    children: [
      { label: "Warehouses & Locations", href: "/settings", icon: Warehouse },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Operations"]);

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
            <p className="text-xs text-white/60">Inventory Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100vh-80px)]">
          {navItems.map((item) => {
            if (item.children) {
              const isExpanded = expandedGroups.includes(item.label);
              const isChildActive = item.children.some((c) => pathname === c.href);

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
                          href={child.href}
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
