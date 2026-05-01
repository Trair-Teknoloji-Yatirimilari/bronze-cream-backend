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
import { Badge } from "@/components/ui/badge";
import {
  Users as UsersIcon,
  Shield,
  ShieldX,
  Image as ImageIcon,
  Ban,
  Unlock,
  Loader2,
} from "lucide-react";
import { Users } from "./columns";
import { Button } from "@/components/ui/button";
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

// Extend Window interface
declare global {
  interface Window {
    handleBanUser: (userId: string) => Promise<void>;
    handleUnbanUser: (userId: string) => Promise<void>;
    handleBanDevice: (userId: string) => Promise<void>;
    handleUnbanDevice: (userId: string) => Promise<void>;
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  onRefetch?: () => void;
  token: string;
}


export function DataTable<TData, TValue>({
  columns,
  data,
  loading,
  onRefetch,
  token,
}: DataTableProps<TData, TValue>) {
  const [banLoading, setBanLoading] = useState<string | null>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleBanUser = async (userId: string) => {
    setBanLoading(userId);
    
    if (!token) {
      toast.error("Authentication gerekli");
      setBanLoading(null);
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/users`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, action: "ban", banType: "user" }),
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        toast.success("Kullanıcı başarıyla yasaklandı", {
          description: result.message || "Kullanıcı artık sisteme erişemeyecek",
        });
        if (onRefetch) onRefetch();
      } else {
        toast.error("Kullanıcı yasaklanırken hata oluştu", {
          description: result.error || "Bilinmeyen bir hata oluştu",
        });
      }
    } catch {
      toast.error("Kullanıcı yasaklanırken hata oluştu", {
        description: "Ağ bağlantısı hatası",
      });
    } finally {
      setBanLoading(null);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    setBanLoading(userId);
    
    
    if (!token) {
      toast.error("Authentication gerekli");
      setBanLoading(null);
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/users`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, action: "unban", banType: "user" }),
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        toast.success("Kullanıcı yasağı başarıyla kaldırıldı", {
          description: result.message || "Kullanıcı artık sisteme erişebilir",
        });
        if (onRefetch) onRefetch();
      } else {
        toast.error("Kullanıcı yasağı kaldırılırken hata oluştu", {
          description: result.error || "Bilinmeyen bir hata oluştu",
        });
      }
    } catch {
      toast.error("Kullanıcı yasağı kaldırılırken hata oluştu", {
        description: "Ağ bağlantısı hatası",
      });
    } finally {
      setBanLoading(null);
    }
  };

  const handleBanDevice = async (userId: string) => {
    setBanLoading(userId + "_device");
    
    if (!token) {
      toast.error("Authentication gerekli");
      setBanLoading(null);
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/users`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, action: "ban", banType: "device" }),
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        toast.success("Cihaz başarıyla yasaklandı", {
          description: result.message || "Bu cihazdan tüm hesaplar yasaklandı",
        });
        if (onRefetch) onRefetch();
      } else {
        toast.error("Cihaz yasaklanırken hata oluştu", {
          description: result.error || "Bilinmeyen bir hata oluştu",
        });
      }
    } catch {
      toast.error("Cihaz yasaklanırken hata oluştu", {
        description: "Ağ bağlantısı hatası",
      });
    } finally {
      setBanLoading(null);
    }
  };

  const handleUnbanDevice = async (userId: string) => {
    setBanLoading(userId + "_device");
    
    if (!token) {
      toast.error("Authentication gerekli");
      setBanLoading(null);
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/users`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, action: "unban", banType: "device" }),
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        toast.success("Cihaz yasağı başarıyla kaldırıldı", {
          description: result.message || "Bu cihazdan tüm hesaplar aktif edildi",
        });
        if (onRefetch) onRefetch();
      } else {
        toast.error("Cihaz yasağı kaldırılırken hata oluştu", {
          description: result.error || "Bilinmeyen bir hata oluştu",
        });
      }
    } catch {
      toast.error("Cihaz yasağı kaldırılırken hata oluştu", {
        description: "Ağ bağlantısı hatası",
      });
    } finally {
      setBanLoading(null);
    }
  };

  // Global fonksiyonları window objesine ekle
  if (typeof window !== "undefined") {
    window.handleBanUser = handleBanUser;
    window.handleUnbanUser = handleUnbanUser;
    window.handleBanDevice = handleBanDevice;
    window.handleUnbanDevice = handleUnbanDevice;
  }

  const getStatusIcon = (isBanned: boolean) => {
    if (isBanned) {
      return <ShieldX className="h-4 w-4 text-red-600" />;
    } else {
      return <Shield className="h-4 w-4 text-green-600" />;
    }
  };

  const getStatusBadge = (isBanned: boolean) => {
    if (isBanned) {
      return (
        <Badge variant="destructive" className="text-xs">
          Yasaklı
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 border-green-200 text-xs"
        >
          Aktif
        </Badge>
      );
    }
  };

  const getDeviceBadge = (device: string) => {
    if (device.toLowerCase().includes("android")) {
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 border-green-200"
        >
          Android
        </Badge>
      );
    } else if (
      device.toLowerCase().includes("iphone") ||
      device.toLowerCase().includes("ios")
    ) {
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 border-blue-200"
        >
          iOS
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-800 border-gray-200"
        >
          Diğer
        </Badge>
      );
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
                    <TableHead
                      key={header.id}
                      className="text-center font-semibold text-muted-foreground"
                    >
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
                      {cell.column.id === "device" ? (
                        <div className="flex items-center justify-center">
                          {getDeviceBadge(cell.getValue() as string)}
                        </div>
                      ) : cell.column.id === "uploadedImagesCount" ? (
                        <div className="flex items-center justify-center gap-2">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {cell.getValue() as number}
                          </span>
                        </div>
                      ) : cell.column.id === "isBanned" ? (
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(cell.getValue() as boolean)}
                          {getStatusBadge(cell.getValue() as boolean)}
                        </div>
                      ) : cell.column.id === "userIP" ? (
                        <div className="flex items-center justify-center">
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {cell.getValue() as string === "unknown" ? "Bilinmiyor" : cell.getValue() as string}
                          </code>
                        </div>
                      ) : cell.column.id === "createdAt" ? (
                        <div className="flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {cell.getValue() as string}
                          </span>
                        </div>
                      ) : cell.column.id === "actions" ? (
                        (() => {
                          const isBanned = Boolean(row.getValue("isBanned"));
                          const userId = String(row.getValue("id"));
                          const isLoading = banLoading === userId;
                          const isDeviceLoading = banLoading === userId + "_device";
                          const rowData = row.original as Users;
                          const hasUniqueId = rowData.uniqueId;

                          return (
                            <div className="flex items-center gap-1 justify-center flex-wrap">
                              {isBanned ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                                      disabled={isLoading}
                                    >
                                      {isLoading ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Unlock className="h-3 w-3" />
                                      )}
                                      Yasak Kaldır
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Kullanıcı Yasağını Kaldır
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Bu kullanıcının yasağını kaldırmak
                                        istediğinizden emin misiniz? Kullanıcı
                                        artık sisteme erişebilecek.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        İptal
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleUnbanUser(userId)}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        Yasak Kaldır
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                      disabled={isLoading}
                                    >
                                      {isLoading ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Ban className="h-3 w-3" />
                                      )}
                                      Yasakla
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Kullanıcıyı Yasakla
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Bu kullanıcıyı yasaklamak istediğinizden
                                        emin misiniz? Kullanıcı artık sisteme
                                        erişemeyecek.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        İptal
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleBanUser(userId)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Yasakla
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                              
                              {/* Device Ban Butonları - Sadece uniqueId varsa göster */}
                              {hasUniqueId && (
                                <>
                                  {isBanned ? (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50 text-xs"
                                          disabled={isDeviceLoading}
                                        >
                                          {isDeviceLoading ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Unlock className="h-3 w-3" />
                                          )}
                                          Cihaz Yasak Kaldır
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Cihaz Yasağını Kaldır
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Bu cihazın yasağını kaldırmak istediğinizden emin misiniz? 
                                            Bu cihazdan tüm kullanıcı hesapları aktif edilecek.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            İptal
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleUnbanDevice(userId)}
                                            className="bg-green-600 hover:bg-green-700"
                                          >
                                            Cihaz Yasak Kaldır
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  ) : (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50 text-xs"
                                          disabled={isDeviceLoading}
                                        >
                                          {isDeviceLoading ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Ban className="h-3 w-3" />
                                          )}
                                          Cihaz Yasakla
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Cihazı Yasakla
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Bu cihazı yasaklamak istediğinizden emin misiniz? 
                                            Bu cihazdan tüm kullanıcı hesapları yasaklanacak ve kalıcı olarak erişemeyecek.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            İptal
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleBanDevice(userId)}
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            Cihaz Yasakla
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UsersIcon className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground font-medium">
                      {loading ? "Yükleniyor..." : "Kullanıcı bulunamadı"}
                    </p>
                    {!loading && (
                      <p className="text-xs text-muted-foreground">
                        Henüz hiç kullanıcı kaydı oluşturulmamış
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
