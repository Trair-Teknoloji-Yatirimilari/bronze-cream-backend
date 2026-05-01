import prisma from "@/lib/prisma";
import UsersTableClient from "./UsersTableClient";
import type { User } from "@/lib/generated/prisma";
import { Users } from "./columns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users as UsersIcon,
  Smartphone,
  Globe,
  TrendingUp,
  TrendingDown,
  ShieldX,
} from "lucide-react";
import { cookies } from "next/headers";

const PAGE_SIZE = 10;

function mapToUsers(item: User): Users {
  return {
    id: item.id,
    userIP: item.userIP || "Bilinmiyor",
    userAgent: item.userAgent || "Bilinmiyor",
    uniqueId: item.uniqueId || "Bilinmiyor",
    deviceBrand: item.deviceBrand || "Bilinmiyor",
    deviceId: item.deviceId || "Bilinmiyor",
    deviceName: item.deviceName || "Bilinmiyor",
    deviceType: item.deviceType || "Bilinmiyor",
    systemName: item.systemName || "Bilinmiyor",
    systemVersion: item.systemVersion || "Bilinmiyor",
    appVersion: item.appVersion || "Bilinmiyor",
    isEmulator: item.isEmulator,
    isTablet: item.isTablet,
    device: item.deviceName || "Bilinmiyor",
    isBanned: item.isBanned,
    uploadedImagesCount: 0, // Bu değer ayrıca hesaplanacak
    createdAt: item.createdAt.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export default async function UsersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    skip: 0,
  });

  const totalCount = await prisma.user.count();

  // İstatistikler için veri çekme
  const todayUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });

  const androidUsers = await prisma.user.count({
    where: {
      deviceName: {
        contains: "android",
      },
    },
  });

  const iosUsers = await prisma.user.count({
    where: {
      deviceName: {
        contains: "iPhone",
      },
    },
  });

  const bannedUsers = await prisma.user.count({
    where: {
      isBanned: true,
    },
  });

  // Her kullanıcı için yüklenen fotoğraf sayısını hesapla
  const usersWithImageCounts = await Promise.all(
    users.map(async (user) => {
      const imageCount = await prisma.uploadedImg.count({
        where: {
          userId: user.id,
          isDeleted: false,
        },
      });
      return { ...user, uploadedImagesCount: imageCount };
    })
  );

  const data = usersWithImageCounts.map((user) => ({
    ...mapToUsers(user),
    uploadedImagesCount: user.uploadedImagesCount,
  }));

  // Geçen ay verileri (basit hesaplama)
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: lastMonth,
        lt: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });

  const growthPercent =
    lastMonthUsers > 0
      ? ((todayUsers - lastMonthUsers) / lastMonthUsers) * 100
      : 0;

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Kullanıcı Yönetimi
        </h1>
        <p className="text-muted-foreground">
          Sistem kullanıcılarını görüntüleyin ve yönetin
        </p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Kullanıcı
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {totalCount.toLocaleString("tr-TR")}
              </div>
              {growthPercent !== 0 && (
                <div
                  className={`flex items-center gap-1 text-xs ${
                    growthPercent > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {growthPercent > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(growthPercent).toFixed(1)}%
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Tüm zamanlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugünkü Kayıt</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayUsers.toLocaleString("tr-TR")}
            </div>
            <p className="text-xs text-muted-foreground">Bugün kayıt olan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Android</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {androidUsers.toLocaleString("tr-TR")}
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
              {iosUsers.toLocaleString("tr-TR")}
            </div>
            <p className="text-xs text-muted-foreground">iOS cihazlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yasaklı</CardTitle>
            <ShieldX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bannedUsers.toLocaleString("tr-TR")}
            </div>
            <p className="text-xs text-muted-foreground">
              Yasaklı kullanıcılar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tablo */}
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Listesi</CardTitle>
          <CardDescription>
            Sistem kullanıcılarının detaylı listesi. Toplam{" "}
            {totalCount.toLocaleString("tr-TR")} kullanıcı bulunmaktadır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTableClient
            initialData={data}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            token={token ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
