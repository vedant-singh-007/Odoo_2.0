"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ClipboardCheck, Plus } from "lucide-react";
import { format } from "date-fns";

interface Operation {
  id: string;
  type: string;
  status: string;
  reference: string;
  notes: string;
  createdBy: { name: string };
  createdAt: string;
  moves: {
    id: string;
    quantity: number;
    product: { name: string; skuCode: string };
    sourceLocation: { name: string };
    destLocation: { name: string };
  }[];
}

interface Product { id: string; name: string; skuCode: string; totalStock: number; unitOfMeasure: string; }
interface Location { id: string; name: string; type: string; }

const statusColors: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  DRAFT: "secondary", READY: "default", DONE: "success", CANCELLED: "destructive",
};

export default function AdjustmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [countedQty, setCountedQty] = useState<number>(0);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchOperations = () => {
    fetch("/api/operations?type=ADJUSTMENT")
      .then((r) => r.json())
      .then(setOperations)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOperations();
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    fetch("/api/locations").then((r) => r.json()).then(setLocations);
  }, []);

  const handleValidate = async (id: string) => {
    const res = await fetch(`/api/operations/${id}/validate`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    fetchOperations();
  };

  const selectedProduct = products.find((p) => p.id === productId);
  const currentStock = selectedProduct?.totalStock || 0;
  const difference = countedQty - currentStock;

  const handleCreateAdjustment = async () => {
    setError(""); setSaving(true);

    if (!productId || !locationId) {
      setError("Select product and location"); setSaving(false); return;
    }

    if (difference === 0) {
      setError("No adjustment needed — counted quantity matches current stock"); setSaving(false); return;
    }

    const virtualLoss = locations.find((l) => l.type === "VIRTUAL_LOSS");
    if (!virtualLoss) {
      setError("No virtual loss location configured"); setSaving(false); return;
    }

    // If difference > 0: move from virtual -> internal (adding stock)
    // If difference < 0: move from internal -> virtual (removing stock)
    const moves = difference > 0
      ? [{ productId, sourceLocationId: virtualLoss.id, destLocationId: locationId, quantity: Math.abs(difference) }]
      : [{ productId, sourceLocationId: locationId, destLocationId: virtualLoss.id, quantity: Math.abs(difference) }];

    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ADJUSTMENT", reference,
          notes: `Physical count: ${countedQty}, System stock: ${currentStock}, Difference: ${difference > 0 ? "+" : ""}${difference}`,
          createdById: (session?.user as { id?: string })?.id,
          moves,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setSaving(false); return; }

      // Auto-validate
      const valRes = await fetch(`/api/operations/${data.id}/validate`, { method: "POST" });
      if (!valRes.ok) { const vd = await valRes.json(); setError(vd.error); setSaving(false); return; }

      setShowForm(false);
      setProductId(""); setLocationId(""); setCountedQty(0); setReference("");
      fetchOperations();
      setSaving(false);
    } catch { setError("Failed to create adjustment"); setSaving(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-4 border-[hsl(280,30%,35%)]/20 border-t-[hsl(280,30%,35%)] rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Adjustments</h1>
          <p className="text-gray-500 mt-1">Reconcile physical counts with system stock</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-[hsl(280,30%,35%)] hover:bg-[hsl(280,30%,30%)]" id="new-adjustment-button">
          <Plus className="h-4 w-4 mr-2" />
          New Adjustment
        </Button>
      </div>

      {/* Adjustment Form */}
      {showForm && (
        <Card className="border-0 shadow-md border-l-4 border-l-[hsl(280,30%,35%)]">
          <CardHeader><CardTitle className="text-lg">Physical Count Adjustment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" id="adjustment-error">{error}</div>}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger id="adj-product"><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{products.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.totalStock})</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger id="adj-location"><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>{locations.filter((l) => l.type === "INTERNAL").map((l) => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Counted Quantity</Label>
                <Input type="number" value={countedQty || ""} onChange={(e) => setCountedQty(Number(e.target.value))} placeholder="0" id="adj-counted-qty" />
              </div>
              <div className="space-y-2">
                <Label>Reference</Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="ADJ-002" id="adj-reference" />
              </div>
            </div>

            {productId && (
              <div className="p-4 rounded-lg bg-gray-50 flex items-center gap-6">
                <div><span className="text-sm text-gray-500">System Stock:</span> <span className="font-bold">{currentStock}</span></div>
                <div><span className="text-sm text-gray-500">Counted:</span> <span className="font-bold">{countedQty}</span></div>
                <div>
                  <span className="text-sm text-gray-500">Difference:</span>{" "}
                  <span className={`font-bold ${difference > 0 ? "text-emerald-600" : difference < 0 ? "text-red-600" : "text-gray-600"}`}>
                    {difference > 0 ? "+" : ""}{difference}
                  </span>
                </div>
              </div>
            )}

            <Button onClick={handleCreateAdjustment} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700" id="submit-adjustment">
              {saving ? "Processing..." : "Create & Validate Adjustment"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Adjustment History */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-[hsl(280,30%,35%)]" /> Adjustment History ({operations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operations.map((op) => (
                <TableRow key={op.id}>
                  <TableCell className="font-medium">{op.reference || op.id.slice(0, 8)}</TableCell>
                  <TableCell><Badge variant={statusColors[op.status]}>{op.status}</Badge></TableCell>
                  <TableCell>
                    {op.moves.map((m) => (<div key={m.id} className="text-sm">{m.product.name}: {m.quantity} ({m.sourceLocation.name} → {m.destLocation.name})</div>))}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 max-w-xs truncate">{op.notes}</TableCell>
                  <TableCell>{op.createdBy.name}</TableCell>
                  <TableCell className="text-sm text-gray-500">{format(new Date(op.createdAt), "MMM dd, yyyy HH:mm")}</TableCell>
                  <TableCell className="text-right">
                    {(op.status === "DRAFT" || op.status === "READY") && (
                      <Button size="sm" onClick={() => handleValidate(op.id)} className="bg-emerald-600 hover:bg-emerald-700">Validate</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {operations.length === 0 && (<TableRow><TableCell colSpan={7} className="text-center text-gray-400 py-8">No adjustments found</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
