"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, 
  Monitor, 
  TrendingUp,
  Users,
} from "lucide-react";

interface DeviceStats {
  platforms: Array<{ name: string; count: number }>;
  brands: Array<{ name: string; count: number }>;
  emulators: number;
  tablets: number;
  phones: number;
}

interface TrendData {
  date: string;
  uploads: number;
  users: number;
}

interface DeviceAnalyticsProps {
  deviceStats: DeviceStats;
  trends: { weekly: TrendData[] };
  totalUsers: number;
}

export default function DeviceAnalytics({ deviceStats, trends, totalUsers }: DeviceAnalyticsProps) {
  const topPlatforms = deviceStats.platforms.slice(0, 3);
  const topBrands = deviceStats.brands.slice(0, 5);
  const lastWeek = trends.weekly.slice(-7);
  const totalUploadsThisWeek = lastWeek.reduce((sum, day) => sum + day.uploads, 0);
  const avgDailyUploads = Math.round(totalUploadsThisWeek / 7);
  const emulatorPercentage = totalUsers > 0 ? Math.round((deviceStats.emulators / totalUsers) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Platform Dağılımı */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Platform Dağılımı
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topPlatforms.map((platform) => {
            const percentage = totalUsers > 0 ? Math.round((platform.count / totalUsers) * 100) : 0;
            return (
              <div key={platform.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{platform.name}</span>
                  <span className="text-muted-foreground">{platform.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      platform.name?.toLowerCase() === 'android' ? 'bg-green-500' :
                      platform.name?.toLowerCase() === 'ios' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">%{percentage}</div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* En Popüler Markalar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            En Popüler Markalar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topBrands.map((brand, index) => {
            const percentage = totalUsers > 0 ? Math.round((brand.count / totalUsers) * 100) : 0;
            return (
              <div key={brand.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <span className="text-sm font-medium">{brand.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{brand.count}</div>
                  <div className="text-xs text-muted-foreground">%{percentage}</div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>


      {/* Haftalık Trend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            7 Günlük Ortalama
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{avgDailyUploads}</div>
            <div className="text-sm text-muted-foreground">Günlük Ortalama Yükleme</div>
          </div>
          
          <div className="flex gap-1 h-16 items-end">
            {lastWeek.map((day) => {
              const maxUploads = Math.max(...lastWeek.map(d => d.uploads));
              const height = maxUploads > 0 ? Math.max(8, (day.uploads / maxUploads) * 48) : 8;
              return (
                <div
                  key={day.date}
                  className="flex-1 bg-blue-500 rounded-sm opacity-80 hover:opacity-100 transition-opacity"
                  style={{ height: `${height}px` }}
                  title={`${day.date}: ${day.uploads} yükleme`}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Özet Kartı */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Özet İstatistikler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold">{totalUsers}</div>
              <div className="text-xs text-muted-foreground">Toplam Kullanıcı</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{deviceStats.brands.length}</div>
              <div className="text-xs text-muted-foreground">Farklı Marka</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{deviceStats.platforms.length}</div>
              <div className="text-xs text-muted-foreground">Platform</div>
            </div>
          </div>
          
          {emulatorPercentage > 10 && (
            <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-800">
                <Monitor className="h-3 w-3" />
                <span className="text-xs font-medium">Yüksek Emülatör Kullanımı</span>
              </div>
              <div className="text-xs text-orange-600 mt-1">
                %{emulatorPercentage} kullanıcı emülatör kullanıyor
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 