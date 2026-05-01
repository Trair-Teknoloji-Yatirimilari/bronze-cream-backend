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
import { Badge } from "@/components/ui/badge";
import { Smartphone, Monitor, Globe } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  onRefetch?: () => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes("android")) {
      return <Smartphone className="h-4 w-4 text-green-600" />;
    } else if (device.toLowerCase().includes("iphone") || device.toLowerCase().includes("ios")) {
      return <Smartphone className="h-4 w-4 text-blue-600" />;
    } else {
      return <Monitor className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDeviceBadge = (device: string) => {
    if (device.toLowerCase().includes("android")) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Android</Badge>;
    } else if (device.toLowerCase().includes("iphone") || device.toLowerCase().includes("ios")) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">iOS</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">Diğer</Badge>;
    }
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b bg-muted/50">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-center font-semibold text-muted-foreground">
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
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`border-b transition-colors hover:bg-muted/50 ${
                    index % 2 === 0 ? "bg-background" : "bg-muted/25"
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-center py-3">
                      {cell.column.id === "uploadedImgUrl" ? (
                        (() => {
                          const url = cell.getValue() as string;
                          if (url === "Yok" || url === "Fotoğraf yok") {
                            return (
                              <div className="flex items-center justify-center">
                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                  Fotoğraf yok
                                </Badge>
                              </div>
                            );
                          }
                          return (
                            <div className="flex items-center justify-center">
                              <Image
                                src={'https://eda.atakaneliz.info'+url}
                                alt="upload"
                                width={100}
                                height={100}
                                className="w-12 h-12 object-cover rounded-lg border shadow-sm"
                                onClick={() => {
                                  window.open('https://eda.atakaneliz.info'+url, '_blank');
                                }}
                              />
                            </div>
                          );
                        })()
                      ) : cell.column.id === "device" ? (
                        <div className="flex items-center justify-center gap-2">
                          {getDeviceIcon(cell.getValue() as string)}
                          {getDeviceBadge(cell.getValue() as string)}
                        </div>
                      ) : cell.column.id === "userIp" ? (
                        <div className="flex items-center justify-center">
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {cell.getValue() as string}
                          </code>
                        </div>
                      ) : cell.column.id === "createdAt" ? (
                        <div className="flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {cell.getValue() as string}
                          </span>
                        </div>
                      ) : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Globe className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground font-medium">
                      {loading ? "Yükleniyor..." : "Log kaydı bulunamadı"}
                    </p>
                    {!loading && (
                      <p className="text-xs text-muted-foreground">
                        Henüz hiç log kaydı oluşturulmamış
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 