import prisma from "@/lib/prisma";
import LogsTableClient from "./LogsTableClient";
import type {
  UploadLogs,
  User,
  UploadedImg,
  Products,
} from "@/lib/generated/prisma";
import { Logs } from "./columns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, Clock, Globe, Smartphone } from "lucide-react";

const PAGE_SIZE = 10;

function mapToLogs(
  item: UploadLogs & {
    user: User | null;
    uploadedImg: UploadedImg | null;
    product: Products | null;
  }
): Logs {
  return {
    id: item.id,
    userIp: item.userIp,
    userAgent: item.userAgent,
    createdAt: item.createdAt.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    updatedAt: item.updatedAt.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    userId: item.userId,
    uploadedImgUrl: item.uploadedImg?.url || "Yok",
    productId: item.productId as string,
    device: item.user?.deviceName || "Bilinmiyor",
    deviceBrand: item.user?.deviceBrand || "Bilinmiyor",
    deviceModel: item.user?.deviceName || "Bilinmiyor",
    systemInfo: item.user?.userAgent || "Bilinmiyor",
    isEmulator: item.user?.isEmulator || false,
    isTablet: item.user?.isTablet || false,
    uploadedImgId: item.uploadedImg?.id || "Bilinmiyor",
    productName: item.product?.name || "Bilinmiyor",
    productData: item.product as Products 
  };
}

export default async function LogsPage() {
  const logs = await prisma.uploadLogs.findMany({
    include: {
      user: true,
      uploadedImg: true,
      product: true,
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    skip: 0,
  });

  const totalCount = await prisma.uploadLogs.count();

  // İstatistikler için veri çekme
  const todayLogs = await prisma.uploadLogs.count({
    where: {
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });

  const androidLogs = await prisma.uploadLogs.count({
    where: {
      user: {
        deviceName: {
          contains: "android",
        },
      },
    },
  });

  const iosLogs = await prisma.uploadLogs.count({
    where: {
      user: {
        deviceName: {
          contains: "iPhone",
        },
      },
    },
  });

  const data = logs.map(mapToLogs);

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Sistem Logları</h1>
        <p className="text-muted-foreground">
          Kullanıcı aktivitelerini ve sistem loglarını takip edin
        </p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Log</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCount.toLocaleString("tr-TR")}
            </div>
            <p className="text-xs text-muted-foreground">Tüm zamanlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugünkü Log</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayLogs.toLocaleString("tr-TR")}
            </div>
            <p className="text-xs text-muted-foreground">Bugün</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Android</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {androidLogs.toLocaleString("tr-TR")}
            </div>
            <p className="text-xs text-muted-foreground">Android cihazlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">iOS</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {iosLogs.toLocaleString("tr-TR")}
            </div>
            <p className="text-xs text-muted-foreground">iOS cihazlar</p>
          </CardContent>
        </Card>
      </div>

      {/* Tablo */}
      <Card>
        <CardHeader>
          <CardTitle>Log Detayları</CardTitle>
          <CardDescription>
            Sistem loglarının detaylı listesi. Toplam{" "}
            {totalCount.toLocaleString("tr-TR")} kayıt bulunmaktadır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogsTableClient
            initialData={data}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
          />
        </CardContent>
      </Card>
    </div>
  );
}
