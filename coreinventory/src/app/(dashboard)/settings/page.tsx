"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Settings, Plus, Edit, Trash2, Warehouse, MapPin } from "lucide-react";

interface Location {
  id: string;
  name: string;
  type: string;
}

const typeLabels: Record<string, string> = {
  VENDOR: "Vendor",
  INTERNAL: "Internal Warehouse",
  CUSTOMER: "Customer",
  VIRTUAL_LOSS: "Virtual / Adjustment",
};

const typeBadgeColors: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  VENDOR: "secondary",
  INTERNAL: "success",
  CUSTOMER: "default",
  VIRTUAL_LOSS: "warning",
};

export default function SettingsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editLoc, setEditLoc] = useState<Location | null>(null);
  const [formData, setFormData] = useState({ name: "", type: "INTERNAL" });
  const [error, setError] = useState("");

  const fetchLocations = () => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then(setLocations)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLocations(); }, []);

  const handleCreate = async () => {
    setError("");
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    setShowCreate(false);
    setFormData({ name: "", type: "INTERNAL" });
    fetchLocations();
  };

  const handleUpdate = async () => {
    if (!editLoc) return;
    setError("");
    const res = await fetch(`/api/locations/${editLoc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    setEditLoc(null);
    fetchLocations();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this location?")) return;
    await fetch(`/api/locations/${id}`, { method: "DELETE" });
    fetchLocations();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-4 border-[hsl(280,30%,35%)]/20 border-t-[hsl(280,30%,35%)] rounded-full animate-spin" /></div>;
  }

  const locationFormFields = (
    <>
      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      <div className="space-y-2">
        <Label>Location Name</Label>
        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Warehouse B" id="location-name" />
      </div>
      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
          <SelectTrigger id="location-type"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="INTERNAL">Internal Warehouse</SelectItem>
            <SelectItem value="VENDOR">Vendor</SelectItem>
            <SelectItem value="CUSTOMER">Customer</SelectItem>
            <SelectItem value="VIRTUAL_LOSS">Virtual / Adjustment</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage warehouses and locations</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button onClick={() => { setFormData({ name: "", type: "INTERNAL" }); setError(""); }} className="bg-[hsl(280,30%,35%)] hover:bg-[hsl(280,30%,30%)]" id="create-location-button">
              <Plus className="h-4 w-4 mr-2" />Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Location</DialogTitle><DialogDescription>Add a new warehouse or location.</DialogDescription></DialogHeader>
            <div className="space-y-4">
              {locationFormFields}
              <DialogFooter><Button onClick={handleCreate} className="bg-[hsl(280,30%,35%)] hover:bg-[hsl(280,30%,30%)]" id="location-submit-create">Create Location</Button></DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[hsl(280,30%,35%)]" />
            Locations ({locations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-gray-400" />
                    {loc.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={typeBadgeColors[loc.type]}>{typeLabels[loc.type] || loc.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setFormData({ name: loc.name, type: loc.type }); setEditLoc(loc); setError(""); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDelete(loc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editLoc} onOpenChange={(open) => !open && setEditLoc(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Location</DialogTitle><DialogDescription>Update location details.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            {locationFormFields}
            <DialogFooter><Button onClick={handleUpdate} className="bg-[hsl(280,30%,35%)] hover:bg-[hsl(280,30%,30%)]" id="location-submit-edit">Save Changes</Button></DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
