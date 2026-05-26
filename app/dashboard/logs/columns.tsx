"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Products } from "@/lib/generated/prisma";

export type Logs = {
  id: string;
  userIp: string;
  userAgent: string;
  device: string;
  uploadedImgUrl: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  uploadedImgId: string;
  // Yeni product bilgileri
  productName: string | null;
  productId: string | null;
  productData: Products | null;
  // Device bilgileri
  deviceBrand: string | null;
  deviceModel: string | null;
  systemInfo: string | null;
  isEmulator: boolean | null;
  isTablet: boolean | null;
};

export const columns: ColumnDef<Logs>[] = [
  {
    accessorKey: "id",
    header: "Log ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {String(row.getValue("id")).slice(0, 8)}...
      </span>
    ),
  },
  {
    accessorKey: "userIp",
    header: "Kullanıcı IP Adresi",
    cell: ({ row }) => {
      return (
        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
          {row.getValue("userIp") === "unknown"
            ? "Bilinmiyor"
            : row.getValue("userIp")}
        </code>
      );
    },
  },
  {
    accessorKey: "device",
    header: "Cihaz Bilgisi",
    cell: ({ row }) => {
      const deviceBrand = row.original.deviceBrand;
      const deviceModel = row.original.deviceModel;
      const systemInfo = row.original.systemInfo;
      const isEmulator = row.original.isEmulator;
      const isTablet = row.original.isTablet;

      // Device bilgilerinden en az birisi varsa detaylı gösterim
      if (deviceBrand || systemInfo || deviceModel) {
        const displayBrand =
          deviceBrand || systemInfo?.split(" ")[0] || "Bilinmiyor";
        const platformColor = systemInfo?.toLowerCase().includes("ios")
          ? "bg-blue-100 text-blue-800 border-blue-200"
          : systemInfo?.toLowerCase().includes("android")
          ? "bg-green-100 text-green-800 border-green-200"
          : "bg-gray-100 text-gray-800 border-gray-200";

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={`text-xs ${platformColor}`}>
                {displayBrand}
              </Badge>
              {isEmulator && (
                <Badge
                  variant="outline"
                  className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                >
                  Emulator
                </Badge>
              )}
              {isTablet && (
                <Badge
                  variant="outline"
                  className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                >
                  Tablet
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {deviceModel && (
                <div className="font-mono font-medium">{deviceModel}</div>
              )}
              {systemInfo && <div>{systemInfo}</div>}
            </div>
          </div>
        );
      }

      // Fallback to old logic with improved badges
      const val = String(row.getValue("device"));
      if (val.toLowerCase().includes("android")) {
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 border-green-200"
          >
            Android
          </Badge>
        );
      } else if (
        val.toLowerCase().includes("iphone") ||
        val.toLowerCase().includes("ios")
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
    },
  },
  {
    accessorKey: "productName",
    header: "Kullanılan Ürün",
    cell: ({ row }) => {
      const productName = row.getValue("productName");
      return productName ? (
        <Badge
          variant="outline"
          className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
        >
          {String(productName)}
        </Badge>
      ) : (
        <span className="text-xs text-gray-400 italic">Belirtilmemiş</span>
      );
    },
  },
  {
    accessorKey: "uploadedImgUrl",
    header: "Yüklenen Fotoğraf",
    cell: ({ row }) => {
      const url = String(row.getValue("uploadedImgUrl"));
      if (url === "Yok" || !url || url === "null" || url === "undefined") {
        return (
          <Badge
            variant="outline"
            className="text-xs bg-gray-50 text-gray-500 border-gray-200"
          >
            Fotoğraf yok
          </Badge>
        );
      }
      const finalUrl = url.startsWith("http") ? url : `https://bronze-api.trair.com.tr${url.startsWith("/") ? url : `/filtered/${url}`}`;
      return (
        <div className="flex items-center gap-2">
          <img
            src={finalUrl}
            alt="Thumbnail"
            className="w-8 h-8 rounded object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <Badge
            variant="outline"
            className="text-xs bg-green-50 text-green-700 border-green-200"
          >
            Var
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Oluşturulma Tarihi",
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.getValue("createdAt")}</span>
    ),
  },
];
