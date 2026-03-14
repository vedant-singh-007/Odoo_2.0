"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Save, Package, MapPin } from "lucide-react";
import Link from "next/link";

interface ProductDetail {
  id: string;
  name: string;
  skuCode: string;
  category: string;
  unitOfMeasure: string;
  reorderLevel: number;
  totalStock: number;
  stockPerLocation: {
    locationId: string;
    locationName: string;
    stock: number;
  }[];
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    skuCode: "",
    category: "",
    unitOfMeasure: "",
    reorderLevel: 0,
  });

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data);
        setFormData({
          name: data.name,
          skuCode: data.skuCode,
          category: data.category,
          unitOfMeasure: data.unitOfMeasure,
          reorderLevel: data.reorderLevel,
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const res = await fetch(`/api/products/${id}`);
    const data = await res.json();
    setProduct(data);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-[hsl(280,30%,35%)]/20 border-t-[hsl(280,30%,35%)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return <p>Product not found</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-gray-500">{product.skuCode}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-[hsl(280,30%,35%)]" />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>SKU Code</Label>
                <Input
                  value={formData.skuCode}
                  onChange={(e) => setFormData({ ...formData, skuCode: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger id="product-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                    <SelectItem value="Finished Goods">Finished Goods</SelectItem>
                    <SelectItem value="Consumables">Consumables</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Packaging">Packaging</SelectItem>
                    <SelectItem value="Tools">Tools</SelectItem>
                    <SelectItem value="Spare Parts">Spare Parts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit of Measure</Label>
                <Select value={formData.unitOfMeasure} onValueChange={(val) => setFormData({ ...formData, unitOfMeasure: val })}>
                  <SelectTrigger id="product-uom">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Units">Units</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="Liters">Liters</SelectItem>
                    <SelectItem value="mL">mL</SelectItem>
                    <SelectItem value="Meters">Meters</SelectItem>
                    <SelectItem value="Pieces">Pieces</SelectItem>
                    <SelectItem value="Boxes">Boxes</SelectItem>
                    <SelectItem value="Pallets">Pallets</SelectItem>
                    <SelectItem value="Dozen">Dozen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reorder Level</Label>
                <Input
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[hsl(280,30%,35%)] hover:bg-[hsl(280,30%,30%)]"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Stock Summary */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-5xl font-bold text-[hsl(280,30%,35%)]">
                {product.totalStock}
              </p>
              <p className="text-gray-500 mt-1">{product.unitOfMeasure}</p>
              <Badge
                variant={
                  product.totalStock <= 0
                    ? "destructive"
                    : product.totalStock <= product.reorderLevel
                    ? "warning"
                    : "success"
                }
                className="mt-3"
              >
                {product.totalStock <= 0
                  ? "Out of Stock"
                  : product.totalStock <= product.reorderLevel
                  ? "Low Stock"
                  : "In Stock"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Per Location */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[hsl(280,30%,35%)]" />
            Stock by Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Available Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.stockPerLocation
                .filter((loc) => loc.stock !== 0)
                .map((loc) => (
                  <TableRow key={loc.locationId}>
                    <TableCell className="font-medium">{loc.locationName}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={loc.stock > 0 ? "success" : "destructive"}>
                        {loc.stock} {product.unitOfMeasure}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              {product.stockPerLocation.filter((loc) => loc.stock !== 0).length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-gray-400 py-4">
                    No stock in any location
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
