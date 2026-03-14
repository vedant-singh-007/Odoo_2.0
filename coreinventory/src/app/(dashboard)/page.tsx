"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Package,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat,
  TrendingUp,
  Clock,
  Filter,
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
  pendingReceipts?: number;
  pendingDeliveries?: number;
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
  filters: {
    categories: string[];
    locations: { id: string; name: string; type: string }[];
  };
  userRole?: string;
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

  // Filter state
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("");

  const fetchDashboard = useCallback(() => {
    const params = new URLSearchParams();
    if (filterType && filterType !== "ALL") params.set("type", filterType);
    if (filterStatus && filterStatus !== "ALL") params.set("status", filterStatus);
    if (filterWarehouse && filterWarehouse !== "ALL") params.set("warehouse", filterWarehouse);
    const qs = params.toString();

    fetch(`/api/dashboard${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [filterType, filterStatus, filterWarehouse]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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

  const hasFilters = (filterType && filterType !== "ALL") || (filterStatus && filterStatus !== "ALL") || (filterWarehouse && filterWarehouse !== "ALL");
  const isManager = data.userRole === "MANAGER";

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
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${isManager ? 'xl:grid-cols-5' : 'xl:grid-cols-3'} gap-4`}>
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

        {isManager && (
          <Card className="border-0 shadow-md bg-gradient-to-br from-white to-blue-50 hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Receipts</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1" id="kpi-pending-receipts">
                    {data.pendingReceipts ?? 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <ArrowDownToLine className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Incoming stock</p>
            </CardContent>
          </Card>
        )}

        {isManager && (
          <Card className="border-0 shadow-md bg-gradient-to-br from-white to-amber-50 hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Deliveries</p>
                  <p className="text-3xl font-bold text-amber-600 mt-1" id="kpi-pending-deliveries">
                    {data.pendingDeliveries ?? 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <ArrowUpFromLine className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Outgoing stock</p>
            </CardContent>
          </Card>
        )}

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

      {/* Dynamic Filters */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-[hsl(280,30%,35%)]" />
            Filters
            {hasFilters && (
              <button
                onClick={() => { setFilterType(""); setFilterStatus(""); setFilterWarehouse(""); }}
                className="ml-auto text-xs text-[hsl(280,30%,35%)] hover:underline font-normal"
              >
                Clear all
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-500">Document Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="filter-doc-type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  <SelectItem value="RECEIPT">Receipts</SelectItem>
                  <SelectItem value="DELIVERY">Deliveries</SelectItem>
                  <SelectItem value="TRANSFER">Internal Transfers</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-500">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="filter-status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="READY">Ready</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-500">Warehouse / Location</label>
              <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
                <SelectTrigger id="filter-warehouse">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All locations</SelectItem>
                  {data.filters?.locations?.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name} ({loc.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

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
                All stock levels are healthy
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
              {hasFilters && (
                <Badge variant="secondary" className="ml-2 text-xs">Filtered</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentOperations.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">
                {hasFilters ? "No operations match the filters" : "No operations yet"}
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
