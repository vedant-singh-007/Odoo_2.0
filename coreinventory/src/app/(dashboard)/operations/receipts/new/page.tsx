"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, ArrowDownToLine } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  skuCode: string;
  unitOfMeasure: string;
}

interface Location {
  id: string;
  name: string;
  type: string;
}

interface MoveLine {
  productId: string;
  quantity: number;
}

export default function NewReceiptPage() {
  const router = useRouter();
  const { data: session } = useSession();
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
      // Default source = vendor location, dest = first internal
      const vendor = locs.find((l: Location) => l.type === "VENDOR");
      const internal = locs.find((l: Location) => l.type === "INTERNAL");
      if (vendor) setSourceLocationId(vendor.id);
      if (internal) setDestLocationId(internal.id);
    });
  }, []);

  const addLine = () => {
    setLines([...lines, { productId: "", quantity: 0 }]);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof MoveLine, value: string | number) => {
    const updated = [...lines];
    if (field === "quantity") {
      updated[index][field] = Number(value);
    } else {
      updated[index][field] = value as string;
    }
    setLines(updated);
  };

  const handleSubmit = async (andValidate: boolean = false) => {
    setError("");
    setSaving(true);

    const validLines = lines.filter((l) => l.productId && l.quantity > 0);
    if (validLines.length === 0) {
      setError("Add at least one product with quantity > 0");
      setSaving(false);
      return;
    }

    if (!sourceLocationId || !destLocationId) {
      setError("Select source and destination locations");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "RECEIPT",
          reference,
          notes,
          createdById: (session?.user as { id?: string })?.id,
          moves: validLines.map((line) => ({
            productId: line.productId,
            sourceLocationId,
            destLocationId,
            quantity: line.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setSaving(false);
        return;
      }

      if (andValidate) {
        const valRes = await fetch(`/api/operations/${data.id}/validate`, {
          method: "POST",
        });
        if (!valRes.ok) {
          const valData = await valRes.json();
          setError(valData.error);
          setSaving(false);
          return;
        }
      }

      router.push("/operations/receipts");
    } catch {
      setError("Failed to create receipt");
      setSaving(false);
    }
  };

  const vendorLocations = locations.filter((l) => l.type === "VENDOR");
  const internalLocations = locations.filter((l) => l.type === "INTERNAL");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/operations/receipts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Receipt</h1>
          <p className="text-gray-500 mt-1">Receive goods from vendor</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" id="operation-error">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-[hsl(280,30%,35%)]" />
              Receipt Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reference</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="REC-004"
                  id="receipt-reference"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  id="receipt-notes"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source (Vendor)</Label>
                <Select value={sourceLocationId} onValueChange={setSourceLocationId}>
                  <SelectTrigger id="receipt-source">
                    <SelectValue placeholder="Select vendor location" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorLocations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destination (Warehouse)</Label>
                <Select value={destLocationId} onValueChange={setDestLocationId}>
                  <SelectTrigger id="receipt-dest">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {internalLocations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="w-full"
              variant="outline"
              id="save-draft-button"
            >
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmit(true)}
              disabled={saving}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              id="validate-receipt-button"
            >
              Save & Validate
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Product Lines */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Product Lines</CardTitle>
          <Button size="sm" variant="outline" onClick={addLine} id="add-line-button">
            <Plus className="h-4 w-4 mr-1" />
            Add Line
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lines.map((line, index) => (
              <div key={index} className="flex items-end gap-4 p-3 rounded-lg bg-gray-50">
                <div className="flex-1 space-y-2">
                  <Label>Product</Label>
                  <Select
                    value={line.productId}
                    onValueChange={(v) => updateLine(index, "productId", v)}
                  >
                    <SelectTrigger id={`line-product-${index}`}>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.skuCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32 space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    value={line.quantity || ""}
                    onChange={(e) => updateLine(index, "quantity", e.target.value)}
                    placeholder="0"
                    id={`line-qty-${index}`}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(index)}
                  className="text-red-500 hover:text-red-700 shrink-0"
                  disabled={lines.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
