"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat,
  TrendingUp,
  Clock,
} from "lucide-react";

interface DashboardData {
  totalProducts: number;
  totalStockUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockItems: {
    id: string;
    name: string;
    skuCode: string;
    stock: number;
    reorderLevel: number;
  }[];
  pendingReceipts: number;
  pendingDeliveries: number;
  scheduledTransfers: number;
  recentOperations: {
    id: string;
    type: string;
    status: string;
    reference: string;
    createdBy: string;
    createdAt: string;
    itemCount: number;
  }[];
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  READY: "bg-blue-100 text-blue-700",
  DONE: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const typeIcons: Record<string, string> = {
  RECEIPT: "📥",
  DELIVERY: "📤",
  TRANSFER: "🔄",
  ADJUSTMENT: "📋",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 border-4 border-[hsl(280,30%,35%)]/20 border-t-[hsl(280,30%,35%)] rounded-full animate-spin" />
          <span className="text-lg text-gray-500">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overview of your inventory operations
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-[hsl(280,30%,98%)] hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-1" id="kpi-total-products">
                  {data.totalProducts}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-[hsl(280,30%,35%)]/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-[hsl(280,30%,35%)]" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-xs text-emerald-600 font-medium">
                {data.totalStockUnits.toFixed(0)} total units
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-red-50 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Low Stock Alert</p>
                <p className="text-3xl font-bold text-red-600 mt-1" id="kpi-low-stock">
                  {data.lowStockCount}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-red-500 font-medium">
                {data.outOfStockCount} out of stock
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-blue-50 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Receipts</p>
                <p className="text-3xl font-bold text-blue-600 mt-1" id="kpi-pending-receipts">
                  {data.pendingReceipts}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <ArrowDownToLine className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Incoming stock</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-amber-50 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Deliveries</p>
                <p className="text-3xl font-bold text-amber-600 mt-1" id="kpi-pending-deliveries">
                  {data.pendingDeliveries}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <ArrowUpFromLine className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Outgoing stock</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-purple-50 hover:shadow-lg transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Transfers</p>
                <p className="text-3xl font-bold text-purple-600 mt-1" id="kpi-transfers">
                  {data.scheduledTransfers}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Repeat className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Internal moves</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts Table */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.lowStockItems.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">
                All stock levels are healthy ✅
              </p>
            ) : (
              <div className="space-y-3">
                {data.lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.skuCode}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${item.stock <= 0 ? "text-red-600" : "text-amber-600"}`}>
                        {item.stock}
                      </p>
                      <p className="text-xs text-gray-400">
                        Reorder at {item.reorderLevel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Operations */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-[hsl(280,30%,35%)]" />
              Recent Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentOperations.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">
                No operations yet
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentOperations.map((op) => (
                  <div
                    key={op.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{typeIcons[op.type] || "📦"}</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {op.reference || op.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          by {op.createdBy} · {op.itemCount} item(s)
                        </p>
                      </div>
                    </div>
                    <Badge className={statusColors[op.status]}>
                      {op.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
