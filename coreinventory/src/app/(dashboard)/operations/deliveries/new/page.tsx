"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, ArrowUpFromLine } from "lucide-react";
import Link from "next/link";

interface Product { id: string; name: string; skuCode: string; totalStock: number; }
interface Location { id: string; name: string; type: string; }
interface MoveLine { productId: string; quantity: number; }

export default function NewDeliveryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [sourceLocationId, setSourceLocationId] = useState("");
  const [destLocationId, setDestLocationId] = useState("");
  const [lines, setLines] = useState<MoveLine[]>([{ productId: "", quantity: 0 }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    fetch("/api/locations").then((r) => r.json()).then((locs: Location[]) => {
      setLocations(locs);
      const internal = locs.find((l: Location) => l.type === "INTERNAL");
      const customer = locs.find((l: Location) => l.type === "CUSTOMER");
      if (internal) setSourceLocationId(internal.id);
      if (customer) setDestLocationId(customer.id);
    });
  }, []);

  const addLine = () => setLines([...lines, { productId: "", quantity: 0 }]);
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof MoveLine, value: string | number) => {
    const updated = [...lines];
    if (field === "quantity") updated[i][field] = Number(value);
    else updated[i][field] = value as string;
    setLines(updated);
  };

  const handleSubmit = async (andValidate: boolean = false) => {
    setError(""); setSaving(true);
    const validLines = lines.filter((l) => l.productId && l.quantity > 0);
    if (validLines.length === 0) { setError("Add at least one product with quantity > 0"); setSaving(false); return; }
    if (!sourceLocationId || !destLocationId) { setError("Select source and destination"); setSaving(false); return; }

    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "DELIVERY", reference, notes,
          moves: validLines.map((l) => ({ productId: l.productId, sourceLocationId, destLocationId, quantity: l.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setSaving(false); return; }

      if (andValidate) {
        const valRes = await fetch(`/api/operations/${data.id}/validate`, { method: "POST" });
        if (!valRes.ok) { const valData = await valRes.json(); setError(valData.error); setSaving(false); return; }
      }
      router.push("/operations/deliveries");
    } catch { setError("Failed to create delivery"); setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/operations/deliveries"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Delivery</h1>
          <p className="text-gray-500 mt-1">Ship goods to customer</p>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" id="operation-error">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ArrowUpFromLine className="h-5 w-5 text-[hsl(280,30%,35%)]" />Delivery Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Reference</Label><Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="DEL-003" id="delivery-reference" /></div>
              <div className="space-y-2"><Label>Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source (Warehouse)</Label>
                <Select value={sourceLocationId} onValueChange={setSourceLocationId}>
                  <SelectTrigger id="delivery-source"><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                  <SelectContent>{locations.filter((l) => l.type === "INTERNAL").map((loc) => (<SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destination (Customer)</Label>
                <Select value={destLocationId} onValueChange={setDestLocationId}>
                  <SelectTrigger id="delivery-dest"><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>{locations.filter((l) => l.type === "CUSTOMER").map((loc) => (<SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-lg">Actions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => handleSubmit(false)} disabled={saving} className="w-full" variant="outline" id="save-draft-button">Save as Draft</Button>
            <Button onClick={() => handleSubmit(true)} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700" id="validate-delivery-button">Save & Validate</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Product Lines</CardTitle>
          <Button size="sm" variant="outline" onClick={addLine} id="add-line-button"><Plus className="h-4 w-4 mr-1" />Add Line</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lines.map((line, index) => (
              <div key={index} className="flex items-end gap-4 p-3 rounded-lg bg-gray-50">
                <div className="flex-1 space-y-2">
                  <Label>Product</Label>
                  <Select value={line.productId} onValueChange={(v) => updateLine(index, "productId", v)}>
                    <SelectTrigger id={`line-product-${index}`}><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>{products.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name} ({p.skuCode}) - Stock: {p.totalStock}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="w-32 space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" min="0" value={line.quantity || ""} onChange={(e) => updateLine(index, "quantity", e.target.value)} placeholder="0" id={`line-qty-${index}`} />
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeLine(index)} className="text-red-500 hover:text-red-700 shrink-0" disabled={lines.length === 1}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
