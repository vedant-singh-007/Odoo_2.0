"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { History, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface StockMove {
  id: string;
  quantity: number;
  createdAt: string;
  product: { name: string; skuCode: string };
  sourceLocation: { name: string; type: string };
  destLocation: { name: string; type: string };
  operation: { type: string; status: string; reference: string; createdAt: string };
}

interface Product { id: string; name: string; skuCode: string; }
interface Location { id: string; name: string; type: string; }

const typeColors: Record<string, string> = {
  RECEIPT: "bg-blue-100 text-blue-700",
  DELIVERY: "bg-amber-100 text-amber-700",
  TRANSFER: "bg-purple-100 text-purple-700",
  ADJUSTMENT: "bg-gray-100 text-gray-700",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  READY: "bg-blue-100 text-blue-600",
  DONE: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-600",
};

export default function MovesPage() {
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const fetchMoves = () => {
    const params = new URLSearchParams();
    if (filterProduct && filterProduct !== "all") params.set("productId", filterProduct);
    if (filterLocation && filterLocation !== "all") params.set("locationId", filterLocation);
    if (filterType && filterType !== "all") params.set("operationType", filterType);

    fetch(`/api/moves?${params}`)
      .then((r) => r.json())
      .then(setMoves)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    fetch("/api/locations").then((r) => r.json()).then(setLocations);
  }, []);

  useEffect(() => {
    fetchMoves();
  }, [filterProduct, filterLocation, filterType]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-4 border-[hsl(280,30%,35%)]/20 border-t-[hsl(280,30%,35%)] rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Move History</h1>
        <p className="text-gray-500 mt-1">Complete stock movement ledger</p>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={filterProduct} onValueChange={setFilterProduct}>
              <SelectTrigger id="filter-product"><SelectValue placeholder="All Products" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name} ({p.skuCode})</SelectItem>))}
              </SelectContent>
            </Select>

            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger id="filter-location"><SelectValue placeholder="All Locations" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((l) => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger id="filter-type"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="RECEIPT">Receipts</SelectItem>
                <SelectItem value="DELIVERY">Deliveries</SelectItem>
                <SelectItem value="TRANSFER">Transfers</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-[hsl(280,30%,35%)]" /> Stock Ledger ({moves.length} entries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Movement</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {moves.map((move) => (
                <TableRow key={move.id}>
                  <TableCell className="text-sm text-gray-500">
                    {format(new Date(move.createdAt), "MMM dd, yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {move.operation.reference || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={typeColors[move.operation.type]}>{move.operation.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[move.operation.status]}>{move.operation.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{move.product.name}</p>
                      <p className="text-xs text-gray-400">{move.product.skuCode}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">{move.sourceLocation.name}</span>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">{move.destLocation.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {move.quantity}
                  </TableCell>
                </TableRow>
              ))}
              {moves.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-gray-400 py-8">No stock movements found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
