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
                    {cell.column.id === "img" ? (
                      <Image
                        src={
                          ("https://eda.atakaneliz.info" +
                            cell.getValue()) as string
                        }
                        alt="upload"
                        width={100}
                        height={100}
                        className="w-10 h-10 object-cover rounded-md mx-auto"
                        onClick={() => {
                          window.open(
                            ("https://eda.atakaneliz.info" +
                              cell.getValue()) as string,
                            "_blank"
                          );
                        }}
                      />
                    ) : cell.column.id === "actions" ? (
                      <>
                        <Dialog 
                          open={openDialogs[(row.original as RowWithId).id]?.edit || false}
                          onOpenChange={(isOpen) => setDialogOpen((row.original as RowWithId).id, 'edit', isOpen)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="mr-2"
                              disabled={loading}
                            >
                              <EditIcon />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>
                                Aktiflik Durumunu Değiştir
                              </DialogTitle>
                              <DialogDescription>
                                Fotoğrafınızın aktiflik durumunu değiştirmek
                                istediğinizden emin misiniz? Aktiflik durumunu
                                değiştirmek, fotoğrafın kullanıcılar tarafından
                                görülmesini engelleyecektir.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center gap-2"></div>
                            <DialogFooter className="sm:justify-start flex justify-between w-full">
                              <Button
                                className=""
                                disabled={loading}
                                onClick={() => {
                                  handleUpdate((row.original as RowWithId).id);
                                }}
                              >
                                {loading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "Aktiflik Durumunu Değiştir"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog 
                          open={openDialogs[(row.original as RowWithId).id]?.delete || false}
                          onOpenChange={(isOpen) => setDialogOpen((row.original as RowWithId).id, 'delete', isOpen)}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              disabled={loading}
                            >
                              <TrashIcon />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Silmek istediğine emin misin?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Bu işlem geri alınamaz. Fotoğraf kalıcı olarak
                                silinecek.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDelete((row.original as RowWithId).id)
                                }
                                disabled={loading}
                              >
                                {loading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "Sil"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : cell.column.id === "createdAt" ? (
                      <span className="text-sm text-gray-500 text-center">
                        {cell.getValue() as string}
                      </span>
                    ) : cell.column.id === "isActive" ? (
                      cell.getValue() ? (
                        <Check className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-red-500 mx-auto" />
                      )
                    ) : cell.column.id === "isPublic" ? (
                      cell.getValue() ? (
                        <Check className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-red-500 mx-auto" />
                      )
                    ) : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
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
