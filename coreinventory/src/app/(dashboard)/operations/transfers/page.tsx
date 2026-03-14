"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
import { Repeat, Plus, Trash2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

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

const statusColors: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  DRAFT: "secondary",
  READY: "default",
  DONE: "success",
  CANCELLED: "destructive",
};

export default function TransfersPage() {
  const { data: session } = useSession();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOperations = () => {
    fetch("/api/operations?type=TRANSFER")
      .then((r) => r.json())
      .then(setOperations)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOperations();
  }, []);

  const handleValidate = async (id: string) => {
    const res = await fetch(`/api/operations/${id}/validate`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    fetchOperations();
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this transfer?")) return;
    await fetch(`/api/operations/${id}/cancel`, { method: "POST" });
    fetchOperations();
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Internal Transfers</h1>
          <p className="text-gray-500 mt-1">Move stock between warehouses and locations</p>
        </div>
        <Link href="/operations/transfers/new">
          <Button className="bg-[hsl(280,30%,35%)] hover:bg-[hsl(280,30%,30%)]" id="new-transfer-button">
            <Plus className="h-4 w-4 mr-2" />
            New Transfer
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Repeat className="h-5 w-5 text-[hsl(280,30%,35%)]" />
            Transfer Operations ({operations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>From → To</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operations.map((op) => (
                <TableRow key={op.id}>
                  <TableCell className="font-medium">
                    {op.reference || op.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[op.status]}>{op.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {op.moves.map((m) => (
                        <div key={m.id} className="text-sm">
                          {m.product.name} x {m.quantity}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {op.moves.map((m) => (
                        <div key={m.id} className="text-sm text-gray-600">
                          {m.sourceLocation.name} → {m.destLocation.name}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{op.createdBy.name}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(new Date(op.createdAt), "MMM dd, yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(op.status === "DRAFT" || op.status === "READY") && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleValidate(op.id)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Validate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(op.id)}
                            className="text-red-500 border-red-200 hover:bg-red-50"
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {operations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                    No transfers found
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
