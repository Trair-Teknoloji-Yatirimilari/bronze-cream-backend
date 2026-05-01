"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldX, Image as ImageIcon } from "lucide-react";

export type Users = {
  id: string;
  userIP: string;
  userAgent: string;
  device: string;
  isBanned: boolean;
  uploadedImagesCount: number;
  createdAt: string;
  // Yeni device bilgileri
  uniqueId: string | null;
  deviceBrand: string | null;
  deviceId: string | null;
  deviceName: string | null;
  deviceType: string | null;
  systemName: string | null;
  systemVersion: string | null;
  appVersion: string | null;
  isEmulator: boolean | null;
  isTablet: boolean | null;
};

export const columns: ColumnDef<Users>[] = [
  {
    accessorKey: "id",
    header: "Kullanıcı ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {String(row.getValue("id")).slice(0, 8)}...
      </span>
    ),
  },
  {
    accessorKey: "userIP",
    header: "IP Adresi",
    cell: ({ row }) => (
      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
        {row.getValue("userIP")}
      </code>
    ),
  },
  {
    accessorKey: "device",
    header: "Cihaz Bilgisi",
    cell: ({ row }) => {
      const deviceBrand = row.original.deviceBrand;
      const deviceId = row.original.deviceId;
      const deviceName = row.original.deviceName;
      const systemName = row.original.systemName;
      const systemVersion = row.original.systemVersion;
      const isEmulator = row.original.isEmulator;
      const isTablet = row.original.isTablet;
      const uniqueId = row.original.uniqueId;
      
      // Device bilgilerinden en az birisi varsa detaylı gösterim
      if (deviceBrand || systemName || deviceId) {
        const displayBrand = deviceBrand || systemName || "Bilinmiyor";
        const platformColor = systemName?.toLowerCase() === 'ios' 
          ? 'bg-blue-100 text-blue-800 border-blue-200'
          : systemName?.toLowerCase() === 'android'
          ? 'bg-green-100 text-green-800 border-green-200'
          : 'bg-gray-100 text-gray-800 border-gray-200';
          
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={`text-xs ${platformColor}`}
              >
                {displayBrand}
              </Badge>
              {isEmulator && (
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                  Emulator
                </Badge>
              )}
              {isTablet && (
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                  Tablet
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {deviceId && <div className="font-mono">{deviceId}</div>}
              {systemName && systemVersion && (
                <div>{systemName} {systemVersion}</div>
              )}
              {deviceName && (
                <div className="truncate max-w-[150px]" title={deviceName}>
                  📱 {deviceName}
                </div>
              )}
              {uniqueId && (
                <div className="font-mono text-[10px] text-gray-400">
                  ID: {uniqueId.substring(0, 8)}...
                </div>
              )}
            </div>
          </div>
        );
      }
      
      // Fallback to old logic
      const device = String(row.getValue("device"));
      if (device.toLowerCase().includes("android")) {
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            Android
          </Badge>
        );
      } else if (device.toLowerCase().includes("iphone") || device.toLowerCase().includes("ios")) {
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            iOS
          </Badge>
        );
      } else {
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
            Diğer
          </Badge>
        );
      }
    },
  },
  {
    accessorKey: "uploadedImagesCount",
    header: "Fotoğraf Sayısı",
    cell: ({ row }) => {
      const count = Number(row.getValue("uploadedImagesCount"));
      return (
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{count}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "isBanned",
    header: "Durum",
    cell: ({ row }) => {
      const isBanned = Boolean(row.getValue("isBanned"));
      return (
        <div className="flex items-center gap-2">
          {isBanned ? (
            <>
              <ShieldX className="h-4 w-4 text-red-600" />
              <Badge variant="destructive" className="text-xs">
                Yasaklı
              </Badge>
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 text-green-600" />
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs">
                Aktif
              </Badge>
            </>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Kayıt Tarihi",
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {row.getValue("createdAt")}
      </span>
    ),
  },
  {
    accessorKey: "actions",
    header: "İşlemler",
  },
]; 