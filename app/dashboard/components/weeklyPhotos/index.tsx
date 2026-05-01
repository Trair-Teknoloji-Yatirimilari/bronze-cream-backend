import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import React from "react";

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

interface ApiResponse {
  ok: boolean;
  data: StatisticsData;
  lastMonthData: LastMonthData;
}

interface WeeklyPhotosProps {
  statistics: ApiResponse | null;
}

export default function WeeklyPhotos({ statistics }: WeeklyPhotosProps) {
  const getTrendIcon = (percent: number) => {
    if (percent > 0) return <TrendingUp className="w-8 h-8 text-green-500" />;
    if (percent < 0) return <TrendingDown className="w-8 h-8 text-red-500" />;
    return <Minus className="w-8 h-8 text-gray-500" />;
  };

  const getTrendColor = (percent: number) => {
    if (percent > 0) return "text-green-500";
    if (percent < 0) return "text-red-500";
    return "text-gray-500";
  };

  const getTrendText = (percent: number) => {
    if (percent > 0) return "artış";
    if (percent < 0) return "azalış";
    return "değişim yok";
  };

  if (!statistics || !statistics.ok) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>
            <h1>Haftalık Paylaşılan Fotoğraf</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <p className="text-red-500">Veri yüklenemedi</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPercent = statistics.lastMonthData.percent.total;

  return (
    <>
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>
            <h1>Haftalık Paylaşılan Fotoğraf</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="flex gap-3 items-center">
              <h2 className="text-2xl font-bold">{statistics.data.total.toLocaleString()}</h2>
              {getTrendIcon(totalPercent)}
            </div>
            <p className="text-sm text-muted-foreground">
              Geçen aya göre{" "}
              <span className={`font-bold ${getTrendColor(totalPercent)}`}>
                {Math.abs(totalPercent).toFixed(1)}% {getTrendText(totalPercent)}
              </span>
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Android: {statistics.data.android}</span>
                <span className={getTrendColor(statistics.lastMonthData.percent.android)}>
                  {statistics.lastMonthData.percent.android > 0 ? '+' : ''}{statistics.lastMonthData.percent.android.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>iOS: {statistics.data.ios}</span>
                <span className={getTrendColor(statistics.lastMonthData.percent.ios)}>
                  {statistics.lastMonthData.percent.ios > 0 ? '+' : ''}{statistics.lastMonthData.percent.ios.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Diğer: {statistics.data.other}</span>
                <span className={getTrendColor(statistics.lastMonthData.percent.other)}>
                  {statistics.lastMonthData.percent.other > 0 ? '+' : ''}{statistics.lastMonthData.percent.other.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
