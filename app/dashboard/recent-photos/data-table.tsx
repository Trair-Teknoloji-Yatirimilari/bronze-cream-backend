"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import {
  Check,
  EditIcon,
  Loader2,
  TrashIcon,
  X,
  // XCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useState } from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  onDelete?: () => void;
  onUpdate?: () => void;
  token?: string;
}

interface RowWithId {
  id: string;
  [key: string]: unknown;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading,
  onDelete,
  onUpdate,
  token,
}: DataTableProps<TData, TValue>) {
  const [openDialogs, setOpenDialogs] = useState<Record<string, { edit: boolean; delete: boolean }>>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const setDialogOpen = (rowId: string, type: 'edit' | 'delete', isOpen: boolean) => {
    setOpenDialogs(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [type]: isOpen
      }
    }));
  };

  const handleDelete = async (id: string) => {
    if (loading) return;
    if (!token) {
      toast.error("İşlem için yetki gerekli");
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/uploads`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        toast.success("Fotoğraf başarıyla silindi", {
          description: result.message || "Fotoğrafınız başarıyla silindi",
        });
        setDialogOpen(id, 'delete', false); // Dialog'u kapat
        if (onDelete) onDelete();
      } else {
        toast.error("Fotoğraf silinirken bir hata oluştu", {
          description:
            result.error || "Fotoğrafınız silinirken bir hata oluştu",
        });
      }
    } catch {
      toast.error("Fotoğraf silinirken bir hata oluştu", {
        description: "Ağ hatası oluştu",
      });
    }
  };

  const handleUpdate = async (id: string) => {
    if (loading) return;
    if (!token) {
      toast.error("İşlem için yetki gerekli");
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/uploads`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: id }),
      });

      const result = await response.json();
      console.log(result);

      if (response.ok && result.ok) {
        toast.success("Fotoğraf başarıyla güncellendi", {
          description: result.message || "Fotoğrafınız başarıyla güncellendi",
        });
        setDialogOpen(id, 'edit', false); // Dialog'u kapat
        if (onUpdate) onUpdate();
      } else {
        toast.error("Fotoğraf güncellenirken bir hata oluştu", {
          description:
            result.error || "Fotoğrafınız güncellenirken bir hata oluştu",
        });
      }
    } catch {
      toast.error("Fotoğraf güncellenirken bir hata oluştu", {
        description: "Ağ hatası oluştu",
      });
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="text-center">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-center">
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center"
              >
                Sonuç bulunamadı.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Örnek kullanım:
// <DataTable<Uploads, unknown> columns={columns} data={data} ... />
