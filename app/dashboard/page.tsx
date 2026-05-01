import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AddAdminsComponent from "./components/admins/addAdmin";
import AdminsListComponent from "./components/admins/listAdmins";
import { cookies } from "next/headers";
import { AdminContextInitializer } from "./components/AdminContextInitializer";
import WeeklyPhotos from "./components/weeklyPhotos";
import UsersStatistics from "./components/users";
import TotalFilteredPhotos from "./components/totalFilteredPhotos";
import DeviceAnalytics from "./components/deviceAnalytics";
import { Clock, ExternalLink, Camera, TrendingUp } from "lucide-react";
import Link from "next/link";

/* Client-side fetch kullandığımız için artık gerekli değil
interface AddAdminState {
  ok: boolean;
  message: string;
  error: string | null;
}
*/

/* Client-side fetch kullandığımız için artık gerekli değil
interface DeleteAdminState {
  ok: boolean;
  message: string;
  error: string | null;
}
*/

interface GetAdminsState {
  ok: boolean;
  message: string;
  error: string | null;
  admins: {
    id: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

// Yeni API formatı için tip tanımları
interface NewStatisticsResponse {
  uploads: {
    total: number;
    today: number;
    yesterday: number;
    growth: number;
    public: number;
    hidden: number;
    deleted: number;
  };
  users: {
    total: number;
    today: number;
    yesterday: number;
    growth: number;
    android: number;
    ios: number;
    banned: number;
    active: number;
    uniqueDevices: number;
  };
  devices: {
    platforms: Array<{ name: string; count: number }>;
    brands: Array<{ name: string; count: number }>;
    osVersions: Array<{
      name: string;
      platform: string;
      version: string;
      count: number;
    }>;
    emulators: number;
    tablets: number;
    phones: number;
  };
  trends: {
    weekly: Array<{ date: string; uploads: number; users: number }>;
  };
  system: {
    totalLogs: number;
    todayLogs: number;
  };
}

// Eski format ile uyumluluk için
interface StatisticsData {
  android: number;
  ios: number;
  other: number;
  total: number;
}

interface LastMonthData {
  value: StatisticsData;
  percent: StatisticsData;
}

interface StatisticsResponse {
  ok: boolean;
  data: StatisticsData;
  lastMonthData: LastMonthData;
}

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  async function handleGetAdmins(): Promise<GetAdminsState> {
    "use server";
    try {
      const response = await fetch(
        process.env.API_URL + "/api/dashboard/admins",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      return data;
    } catch (err) {
      return {
        ok: false,
        message: "Bir hata oluştu",
        error: err as string,
        admins: [],
      };
    }
  }

  async function getStatistics(): Promise<NewStatisticsResponse | null> {
    "use server";
    try {
      const baseUrl = process.env.API_URL || "https://eda.atakaneliz.info";
      const response = await fetch(`${baseUrl}/api/dashboard/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(
          "Statistics API error:",
          response.status,
          response.statusText
        );
        return null;
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Statistics fetch error:", err);
      return null;
    }
  }

  // Eski format ile uyumluluk için adapter fonksiyonları
  function adaptStatisticsForWeeklyPhotos(
    stats: NewStatisticsResponse | null
  ): StatisticsResponse | null {
    if (!stats) return null;

    return {
      ok: true,
      data: {
        android: stats.users.android,
        ios: stats.users.ios,
        other: stats.users.total - stats.users.android - stats.users.ios,
        total: stats.uploads.total,
      },
      lastMonthData: {
        value: {
          android: stats.users.android,
          ios: stats.users.ios,
          other: stats.users.total - stats.users.android - stats.users.ios,
          total: stats.uploads.yesterday,
        },
        percent: {
          android: 0, // Şimdilik sabit
          ios: 0,
          other: 0,
          total: stats.uploads.growth,
        },
      },
    };
  }

  function adaptStatisticsForUsers(
    stats: NewStatisticsResponse | null
  ): StatisticsResponse | null {
    if (!stats) return null;

    return {
      ok: true,
      data: {
        android: stats.users.android,
        ios: stats.users.ios,
        other: stats.users.total - stats.users.android - stats.users.ios,
        total: stats.users.total,
      },
      lastMonthData: {
        value: {
          android: stats.users.android,
          ios: stats.users.ios,
          other: stats.users.total - stats.users.android - stats.users.ios,
          total: stats.users.yesterday,
        },
        percent: {
          android: 0, // Şimdilik sabit
          ios: 0,
          other: 0,
          total: stats.users.growth,
        },
      },
    };
  }

  const admins = await handleGetAdmins();
  const statistics = await getStatistics();
  const weeklyPhotosStats = adaptStatisticsForWeeklyPhotos(statistics);
  const usersStats = adaptStatisticsForUsers(statistics);

  //TODO: Bilinen Hatalar
  //TODO: Bronze-effect API emulator ile test edilecek.
  //! Bronze-effect test edildi. birden fazla seçili alan gelirse hata veriyor.

  return (
    <>
      <AdminContextInitializer initialAdmins={admins.admins} />
      <div className="w-full h-full grid grid-cols-12 grid-rows-12 gap-5 ">
        {/* //TODO: Buraya Haftalık paylaşılan fotoğraf verisi gelecek */}
        <div className="col-span-3 row-span-3 hover:shadow-lg transition-shadow">
          <WeeklyPhotos statistics={weeklyPhotosStats} />
        </div>

        {/* //TODO: Buraya toplam yeni kullanıcı sayısı gelecek android/ios/diğer sayı verisi olarak */}
        <div className="col-span-3 row-span-3 hover:shadow-lg transition-shadow">
          <UsersStatistics statistics={usersStats} />
        </div>

        {/* Yüklenen Fotoğraflar Kartı */}

        <Card className="col-span-6 row-span-6 flex flex-col gap-3 p-4 relative h-full w-full ">
          <h1 className="text-xl font-bold">Yeni Admin Ekle</h1>
          <AddAdminsComponent token={token ?? ""} />
          <h1 className="text-xl font-bold">Admin Listesi</h1>
          <AdminsListComponent token={token ?? ""} admins={admins.admins} />
        </Card>
        {/* //TODO: Buraya toplam filtre uygulanma sayısı gelecek çizgi grafik android/ios/diğer şeklinde */}
        <div className="col-span-3 row-span-3  hover:shadow-lg transition-shadow ">
          <TotalFilteredPhotos statistics={weeklyPhotosStats} />
        </div>
        <div className="col-span-3 row-span-3 hover:shadow-lg transition-shadow">
          <Card className="h-full p-4  hover:shadow-lg transition-shadow">
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2  rounded-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold ">Yüklenen Fotoğraflar</h3>
                    <p className="text-xs ">Son 48 saat</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="h-4 w-4 " />
                    <span className="text-sm  font-medium">
                      Yeni Fotoğraflar
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold ">
                      {statistics?.uploads?.today || 0}
                    </span>
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs">Son 24h</span>
                    </div>
                  </div>
                </div>
              </div>

              <Link href="/dashboard/recent-photos">
                <Button className="w-full  hover: text-white" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Tümünü Göster
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Device Analytics */}
        <div className="col-span-12 row-span-6 ">
          <h1 className="text-2xl font-bold px-4 mb-4">Device Analitikleri</h1>
          {statistics?.devices && statistics?.trends && (
            <DeviceAnalytics
              deviceStats={statistics.devices}
              trends={statistics.trends}
              totalUsers={statistics.users.total}
            />
          )}
        </div>
      </div>
    </>
  );
}
