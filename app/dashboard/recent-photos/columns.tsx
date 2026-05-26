"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  Eye,
  EyeOff,
  Download,
  ExternalLink,
  MoreHorizontal,
  Smartphone,
  Tablet,
  Monitor,
  Zap,
  Clock,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type RecentPhotos = {
  id: string;
  img: string;
  device: string;
  productName: string | null;
  productId: string | null;
  isPublic: boolean;
  createdAt: string;
  uploadTime: string;
  isActive: boolean;
  // Device bilgileri
  deviceBrand: string | null;
  deviceModel: string | null;
  systemInfo: string | null;
  isEmulator: boolean | null;
  isTablet: boolean | null;
  // User bilgileri
  userId: string | null;
  userIP: string | null;
};

// Helper function to get device icon
const getDeviceIcon = (
  deviceBrand: string | null,
  systemInfo: string | null,
  isTablet: boolean | null
) => {
  if (isTablet) return Tablet;
  if (
    systemInfo?.toLowerCase().includes("ios") ||
    deviceBrand?.toLowerCase().includes("apple")
  )
    return Smartphone;
  if (systemInfo?.toLowerCase().includes("android")) return Smartphone;
  return Monitor;
};

// Helper function to get platform color
const getPlatformColor = (
  systemInfo: string | null,
  deviceBrand: string | null
) => {
  if (
    systemInfo?.toLowerCase().includes("ios") ||
    deviceBrand?.toLowerCase().includes("apple")
  ) {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }
  if (systemInfo?.toLowerCase().includes("android")) {
    return "bg-green-100 text-green-800 border-green-200";
  }
  return "bg-gray-100 text-gray-800 border-gray-200";
};

// Helper function to calculate time ago
const parseCustomDate = (dateStr: string) => {
  // "17.07.2025 00:18"
  const [datePart, timePart] = dateStr.split(" ");
  if (!datePart || !timePart) return null;
  const [day, month, year] = datePart.split(".").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  if ([day, month, year, hour, minute].some((v) => isNaN(v))) return null;
  return new Date(year, month - 1, day, hour, minute);
};

const getTimeAgo = (uploadTime: string) => {
  let upload = new Date(uploadTime);
  if (isNaN(upload.getTime())) {
    // Özel formatı dene
    upload = parseCustomDate(uploadTime) as Date;
    if (!upload || isNaN(upload.getTime())) {
      return "Bilinmiyor";
    }
  }
  const now = new Date();
  const diffMs = now.getTime() - upload.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "Az önce";
  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  return `${Math.floor(diffHours / 24)} gün önce`;
};

export const columns: ColumnDef<RecentPhotos>[] = [
  {
    accessorKey: "img",
    header: "Fotoğraf",
    cell: ({ row }) => {
      const imgUrl = String(row.getValue("img"));
      const isActive = row.original.isActive;
      const isPublic = row.original.isPublic;
      const uploadTime = row.original.uploadTime;
      const timeAgo = getTimeAgo(uploadTime);
      const isImgValid = imgUrl && imgUrl !== 'null' && imgUrl !== 'undefined';
      return (
        <div className="relative group">
          <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 group-hover:border-blue-300 transition-all duration-200 bg-gray-50 shadow-sm flex items-center justify-center">
            {isImgValid ? (
              <img
                src={imgUrl}
                alt="Recent Upload"
                className={`w-full h-full object-cover transition-all duration-200 group-hover:scale-105 ${!isActive ? "grayscale opacity-60" : ""}`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.style.display = "none";
                }}
              />
            ) : (
              // Eğer img yoksa veya hatalıysa skeleton veya placeholder göster
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <span className="text-xs text-gray-400">Görsel Yok</span>
              </div>
            )}
            {/* Overlay badges */}
            <div className="absolute top-1 right-1 flex flex-col gap-1">
              {isPublic ? (
                <Badge className="text-[10px] px-1 py-0 bg-green-500/90 text-white border-0">
                  <Eye className="w-2 h-2" />
                </Badge>
              ) : (
                <Badge className="text-[10px] px-1 py-0 bg-gray-500/90 text-white border-0">
                  <EyeOff className="w-2 h-2" />
                </Badge>
              )}
            </div>
            {/* Time overlay */}
            <div className="absolute bottom-1 left-1 right-1 ">
              <Badge className="text-[9px] px-1 py-0 bg-black/70 text-white border-0 w-full justify-center truncate">
                <Clock className="w-2 h-2 mr-1" />
                {timeAgo}
              </Badge>
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "device",
    header: "Cihaz",
    cell: ({ row }) => {
      const deviceBrand = row.original.deviceBrand;
      const deviceModel = row.original.deviceModel;
      const systemInfo = row.original.systemInfo;
      const isEmulator = row.original.isEmulator;
      const isTablet = row.original.isTablet;

      const DeviceIcon = getDeviceIcon(deviceBrand, systemInfo, isTablet);
      const platformColor = getPlatformColor(systemInfo, deviceBrand);

      if (deviceBrand || systemInfo || deviceModel) {
        const displayBrand =
          deviceBrand || systemInfo?.split(" ")[0] || "Bilinmiyor";

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1.5 cursor-help justify-center items-center flex flex-col">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge
                      variant="secondary"
                      className={`text-xs font-medium ${platformColor} flex items-center gap-1`}
                    >
                      <DeviceIcon className="w-3 h-3" />
                      {displayBrand}
                    </Badge>
                    {isEmulator && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0 bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1"
                      >
                        <Zap className="w-2 h-2" />
                        Emul
                      </Badge>
                    )}
                    {isTablet && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0 bg-purple-50 text-purple-700 border-purple-200"
                      >
                        Tab
                      </Badge>
                    )}
                  </div>
                  {deviceModel && (
                    <div className="text-[10px] text-muted-foreground">
                      <div className="font-mono text-[10px] bg-gray-100 px-1 py-0.5 rounded text-gray-700 max-w-[100px] truncate">
                        {deviceModel}
                      </div>
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="text-sm">
                  <div className="font-medium mb-1">Cihaz Detayları</div>
                  <div className="space-y-1 text-xs">
                    {deviceBrand && (
                      <div>
                        <span className="font-medium">Marka:</span>{" "}
                        {deviceBrand}
                      </div>
                    )}
                    {deviceModel && (
                      <div>
                        <span className="font-medium">Model:</span>{" "}
                        {deviceModel}
                      </div>
                    )}
                    {systemInfo && (
                      <div>
                        <span className="font-medium">Sistem:</span>{" "}
                        {systemInfo}
                      </div>
                    )}
                    {isEmulator && (
                      <div className="text-orange-600">
                        ⚠️ Emulator kullanılmış
                      </div>
                    )}
                    {isTablet && (
                      <div className="text-purple-600">📱 Tablet cihaz</div>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      // Fallback
      const val = String(row.getValue("device"));
      const FallbackIcon = val.toLowerCase().includes("android")
        ? Smartphone
        : val.toLowerCase().includes("ios")
        ? Smartphone
        : Monitor;

      if (val.toLowerCase().includes("android")) {
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 w-fit text-xs"
          >
            <FallbackIcon className="w-3 h-3" />
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
            className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1 w-fit text-xs"
          >
            <FallbackIcon className="w-3 h-3" />
            iOS
          </Badge>
        );
      } else {
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1 w-fit text-xs"
          >
            <FallbackIcon className="w-3 h-3" />
            Diğer
          </Badge>
        );
      }
    },
  },
  {
    accessorKey: "productName",
    header: "Ürün",
    cell: ({ row }) => {
      const productName = row.getValue("productName");

      if (productName) {
        const productId = row.original.productId || "";
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={`/dashboard/products?product=${productId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Badge
                    variant="outline"
                    className="text-xs bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200 font-medium px-2 py-0.5 max-w-[120px] truncate cursor-pointer hover:underline"
                  >
                    ✨ {String(productName)}
                  </Badge>
                </a>
              </TooltipTrigger>
              <TooltipContent>Ürün detayına git</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      return (
        <Badge
          variant="outline"
          className="text-xs bg-gray-50 text-gray-500 border-gray-200"
        >
          -
        </Badge>
      );
    },
  },
  {
    accessorKey: "userId",
    header: "Kullanıcı",
    cell: ({ row }) => {
      const userId = row.original.userId;
      const userIP = row.original.userIP;

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help justify-center">
                <User className="h-4 w-4 text-gray-400" />
                <div className="text-xs">
                  <div className="font-mono text-[10px] text-gray-600">
                    {userId?.slice(0, 8)}...
                  </div>
                  {userIP && userIP !== "unknown" && (
                    <div className="text-[10px] text-gray-500">{userIP}</div>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <div className="font-medium mb-1">Kullanıcı Bilgileri</div>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="font-medium">ID:</span> {userId}
                  </div>
                  {userIP && (
                    <div>
                      <span className="font-medium">IP:</span> {userIP}
                    </div>
                  )}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "isPublic",
    header: "Durum",
    cell: ({ row }) => {
      const isPublic = Boolean(row.getValue("isPublic"));
      const isActive = row.original.isActive;

      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {isPublic ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 border-green-200 text-[10px] font-medium flex items-center gap-1"
                >
                  <Eye className="h-2 w-2" />
                  Açık
                </Badge>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <Badge
                  variant="outline"
                  className="bg-gray-50 text-gray-700 border-gray-200 text-[10px] flex items-center gap-1"
                >
                  <EyeOff className="h-2 w-2" />
                  Özel
                </Badge>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isActive ? (
              <>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-medium flex items-center gap-1"
                >
                  <Check className="h-2 w-2" />
                  Aktif
                </Badge>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 border-red-200 text-[10px] flex items-center gap-1"
                >
                  <X className="h-2 w-2" />
                  Pasif
                </Badge>
              </>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "uploadTime",
    header: "Yüklenme Zamanı",
    cell: ({ row }) => {
      const uploadTime = row.getValue("uploadTime") as string;
      const timeAgo = getTimeAgo(uploadTime);
      const formattedDate = new Date(uploadTime).toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col cursor-help items-center justify-center">
                <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-500" />
                  {timeAgo}
                </span>
                <span className="text-xs text-gray-500">{formattedDate}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <div className="font-medium mb-1">Yüklenme Detayı</div>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="font-medium">Tam Tarih:</span> {formattedDate}
                  </div>
                  <div>
                    <span className="font-medium">Geçen Süre:</span> {timeAgo}
                  </div>
                  <div>
                    <span className="font-medium">Fotoğraf ID:</span>{" "}
                    {row.original.id}
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "actions",
    header: "İşlemler",
    cell: ({ row }) => {
      const imgUrl = row.original.img;
      const isActive = row.original.isActive;
      const isPublic = row.original.isPublic;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
              <span className="sr-only">İşlem menüsünü aç</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs font-medium text-gray-700">
              Fotoğraf İşlemleri
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4" />
              <a
                href={imgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                Görüntüle
              </a>
              <ExternalLink className="h-3 w-3 text-gray-400" />
            </DropdownMenuItem>

            <DropdownMenuItem className="flex items-center gap-2 text-sm">
              <Download className="h-4 w-4" />
              <a href={imgUrl} download className="flex-1">
                İndir
              </a>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="flex items-center gap-2 text-sm text-blue-600">
              {isPublic ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {isPublic ? "Gizle" : "Aç"}
            </DropdownMenuItem>

            <DropdownMenuItem
              className={`flex items-center gap-2 text-sm ${
                isActive ? "text-orange-600" : "text-green-600"
              }`}
            >
              {isActive ? (
                <X className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isActive ? "Pasif Et" : "Aktif Et"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
