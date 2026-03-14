"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Package, Edit, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  skuCode: string;
  category: string;
  unitOfMeasure: string;
  reorderLevel: number;
  totalStock: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    skuCode: "",
    category: "General",
    unitOfMeasure: "Units",
    reorderLevel: 10,
  });
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const handleCreate = async () => {
    setError("");
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setShowCreateDialog(false);
    setFormData({ name: "", skuCode: "", category: "General", unitOfMeasure: "Units", reorderLevel: 10 });
    fetchProducts();
  };

  const handleUpdate = async () => {
    if (!editProduct) return;
    setError("");
    const res = await fetch(`/api/products/${editProduct.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setEditProduct(null);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  const openEdit = (product: Product) => {
    setFormData({
      name: product.name,
      skuCode: product.skuCode,
      category: product.category,
      unitOfMeasure: product.unitOfMeasure,
      reorderLevel: product.reorderLevel,
    });
    setEditProduct(product);
    setError("");
  };

  const openCreate = () => {
    setFormData({ name: "", skuCode: "", category: "General", unitOfMeasure: "Units", reorderLevel: 10 });
    setError("");
    setShowCreateDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-[hsl(280,30%,35%)]/20 border-t-[hsl(280,30%,35%)] rounded-full animate-spin" />
      </div>
    );
  }

  const ProductForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product-name">Name</Label>
          <Input
            id="product-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Steel Rods"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-sku">SKU Code</Label>
          <Input
            id="product-sku"
            value={formData.skuCode}
            onChange={(e) => setFormData({ ...formData, skuCode: e.target.value })}
            placeholder="STL-001"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product-category">Category</Label>
          <Input
            id="product-category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="Raw Materials"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-uom">Unit of Measure</Label>
          <Input
            id="product-uom"
            value={formData.unitOfMeasure}
            onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
            placeholder="kg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-reorder">Reorder Level</Label>
          <Input
            id="product-reorder"
            type="number"
            value={formData.reorderLevel}
            onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onSubmit} className="bg-[hsl(280,30%,35%)] hover:bg-[hsl(280,30%,30%)]" id="product-submit">
          {submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreate}
              className="bg-[hsl(280,30%,35%)] hover:bg-[hsl(280,30%,30%)]"
              id="create-product-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Product</DialogTitle>
              <DialogDescription>Add a new product to your inventory catalog.</DialogDescription>
            </DialogHeader>
            <ProductForm onSubmit={handleCreate} submitLabel="Create Product" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              id="product-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-[hsl(280,30%,35%)]" />
            Product Catalog ({products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>UoM</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/products/${product.id}`}
                      className="text-[hsl(280,30%,35%)] hover:underline"
                    >
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{product.skuCode}</code>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.unitOfMeasure}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        product.totalStock <= 0
                          ? "destructive"
                          : product.totalStock <= product.reorderLevel
                          ? "warning"
                          : "success"
                      }
                    >
                      {product.totalStock}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(product)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    No products found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editProduct} onOpenChange={(open) => !open && setEditProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information.</DialogDescription>
          </DialogHeader>
          <ProductForm onSubmit={handleUpdate} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
