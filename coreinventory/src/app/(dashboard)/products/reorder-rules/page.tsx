"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { RefreshCw, Plus, Pencil, Trash2 } from "lucide-react";

interface ReorderRule {
  id: string;
  productId: string;
  locationId: string;
  minQuantity: number;
  maxQuantity: number;
  reorderPoint: number;
  product: { name: string; skuCode: string };
  location: { name: string; type: string };
}

interface Product { id: string; name: string; skuCode: string; }
interface Location { id: string; name: string; type: string; }

export default function ReorderRulesPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;
  const [rules, setRules] = useState<ReorderRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReorderRule | null>(null);

  // Form state
  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [minQuantity, setMinQuantity] = useState(0);
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [reorderPoint, setReorderPoint] = useState(10);
  const [error, setError] = useState("");

  const fetchRules = () => {
    fetch("/api/reorder-rules")
      .then((r) => r.json())
      .then(setRules)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRules();
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    fetch("/api/locations").then((r) => r.json()).then(setLocations);
  }, []);

  const resetForm = () => {
    setProductId("");
    setLocationId("");
    setMinQuantity(0);
    setMaxQuantity(0);
    setReorderPoint(10);
    setError("");
    setEditingRule(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (rule: ReorderRule) => {
    setEditingRule(rule);
    setProductId(rule.productId);
    setLocationId(rule.locationId);
    setMinQuantity(rule.minQuantity);
    setMaxQuantity(rule.maxQuantity);
    setReorderPoint(rule.reorderPoint);
    setError("");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setError("");
    if (!editingRule && (!productId || !locationId)) {
      setError("Product and location are required");
      return;
    }

    const url = editingRule ? `/api/reorder-rules/${editingRule.id}` : "/api/reorder-rules";
    const method = editingRule ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        locationId,
        minQuantity,
        maxQuantity,
        reorderPoint,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }

    setDialogOpen(false);
    resetForm();
    fetchRules();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this reorder rule?")) return;
    await fetch(`/api/reorder-rules/${id}`, { method: "DELETE" });
    fetchRules();
  };

  if (userRole !== "MANAGER") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-[hsl(280,30%,35%)]/20 border-t-[hsl(280,30%,35%)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reordering Rules</h1>
          <p className="text-gray-500 mt-1">Configure automatic reorder alerts per product and location</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-[hsl(280,30%,35%)] hover:bg-[hsl(280,30%,30%)]">
              <Plus className="h-4 w-4 mr-2" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRule ? "Edit Reorder Rule" : "Create Reorder Rule"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={productId} onValueChange={setProductId} disabled={!!editingRule}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.skuCode})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={locationId} onValueChange={setLocationId} disabled={!!editingRule}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {locations.filter((l) => l.type === "INTERNAL").map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Min Qty</Label>
                  <Input type="number" min="0" value={minQuantity} onChange={(e) => setMinQuantity(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Reorder Point</Label>
                  <Input type="number" min="0" value={reorderPoint} onChange={(e) => setReorderPoint(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Max Qty</Label>
                  <Input type="number" min="0" value={maxQuantity} onChange={(e) => setMaxQuantity(Number(e.target.value))} />
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full bg-[hsl(280,30%,35%)] hover:bg-[hsl(280,30%,30%)]">
                {editingRule ? "Update Rule" : "Create Rule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-[hsl(280,30%,35%)]" />
            Reorder Rules ({rules.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Min Qty</TableHead>
                <TableHead>Reorder Point</TableHead>
                <TableHead>Max Qty</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{rule.product.name}</p>
                      <p className="text-xs text-gray-400">{rule.product.skuCode}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{rule.location.name}</Badge>
                  </TableCell>
                  <TableCell>{rule.minQuantity}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{rule.reorderPoint}</Badge>
                  </TableCell>
                  <TableCell>{rule.maxQuantity}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(rule)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(rule.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    No reorder rules configured
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
