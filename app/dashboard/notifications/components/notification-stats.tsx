"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Users, 
  Bell, 
  UserX,  
  TrendingUp, 
  RefreshCw,
  Activity,
  Smartphone,
  Clock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationStats {
  totalUsers: number;
  usersWithPushToken: number;
  bannedUsers: number;
  recentUsers: number;
  notificationCoverage: string;
  // Bildirim gönderim istatistikleri
  totalNotificationsSent: number;
  totalNotificationsSuccess: number;
  totalNotificationsError: number;
  totalNotificationCampaigns: number;
  recentNotificationsSent: number;
  recentNotificationsSuccess: number;
  recentNotificationsError: number;
  recentNotificationCampaigns: number;
  notificationSuccessRate: string;
}

export default function NotificationStats({ token }: { token?: string }) {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  // İstatistikleri getir
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const authToken = token || localStorage.getItem("adminToken");
      console.log("Stats - Auth token:", authToken ? "mevcut" : "bulunamadı");
      const response = await fetch("/api/dashboard/pushNotification", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      
      console.log("Stats response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Stats result:", result);
        if (result.success) {
          setStats(result.stats);
        } else {
          toast.error("İstatistikler alınamadı");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Stats API error:", response.status, errorData);
        toast.error(`İstatistikler yüklenirken hata oluştu (${response.status})`);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("İstatistikler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // İlk yükleme
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Kapsama oranına göre renk belirle


  // Kapsama oranına göre durum metni
  const getCoverageStatus = (coverage: string) => {
    const rate = parseFloat(coverage);
    if (rate >= 80) return { text: "Mükemmel", variant: "default" as const };
    if (rate >= 50) return { text: "İyi", variant: "secondary" as const };
    return { text: "Düşük", variant: "destructive" as const };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="col-span-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">İstatistikler yüklenemedi</p>
            <Button onClick={fetchStats} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tekrar Dene
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const coverageStatus = getCoverageStatus(stats.notificationCoverage);

  return (
    <div className="space-y-6">
      {/* Ana İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Toplam Kullanıcı */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Sistemde kayıtlı kullanıcı sayısı
            </p>
          </CardContent>
        </Card>

        {/* Push Token Sahibi Kullanıcılar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bildirim Alabilir</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.usersWithPushToken.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
             {` Push token'ı olan kullanıcılar`}
            </p>
          </CardContent>
        </Card>

        {/* Yasaklı Kullanıcılar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yasaklı Kullanıcı</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.bannedUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Engellenmiş kullanıcı sayısı
            </p>
          </CardContent>
        </Card>

        {/* Son 30 Günde Kayıt Olan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yeni Kullanıcı</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.recentUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Son 30 günde kayıt olan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bildirim Gönderim İstatistikleri */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Toplam Kampanya */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kampanya</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNotificationCampaigns.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Şimdiye kadar gönderilen kampanya sayısı
            </p>
          </CardContent>
        </Card>

        {/* Toplam Gönderim */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gönderim</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalNotificationsSent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Gönderilen toplam bildirim sayısı
            </p>
          </CardContent>
        </Card>

        {/* Başarılı Gönderimler */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarılı Gönderim</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalNotificationsSuccess.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Başarıyla ulaştırılan bildirimler
            </p>
          </CardContent>
        </Card>

        {/* Başarı Oranı */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarı Oranı</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              %{stats.notificationSuccessRate}
            </div>
            <p className="text-xs text-muted-foreground">
              Genel bildirim başarı oranı
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Son 30 Günde Bildirim Aktivitesi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Son 30 Günde Aktivite
            </CardTitle>
            <CardDescription>
              Yakın zamanda gönderilen bildirimler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Kampanya Sayısı</span>
                <span className="text-lg font-bold">{stats.recentNotificationCampaigns}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Gönderilen</span>
                <span className="text-lg font-bold text-blue-600">{stats.recentNotificationsSent.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Başarılı</span>
                <span className="text-lg font-bold text-green-600">{stats.recentNotificationsSuccess.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Başarısız</span>
                <span className="text-lg font-bold text-red-600">{stats.recentNotificationsError.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bildirim Kapsamı Analizi */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Bildirim Kapsamı
            </CardTitle>
            <CardDescription>
              Kullanıcıların kaçı bildirimleri alabilir durumda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Kapsama Oranı</span>
                <Badge variant={coverageStatus.variant}>
                  {coverageStatus.text}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>%{stats.notificationCoverage}</span>
                  <span className="text-muted-foreground">
                    {stats.usersWithPushToken} / {stats.totalUsers}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      parseFloat(stats.notificationCoverage) >= 80 
                        ? "bg-green-500" 
                        : parseFloat(stats.notificationCoverage) >= 50 
                        ? "bg-yellow-500" 
                        : "bg-red-500"
                    }`}
                    style={{ width: `${stats.notificationCoverage}%` }}
                  />
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  {parseFloat(stats.notificationCoverage) >= 80 
                    ? "Kullanıcılarınızın büyük çoğunluğuna ulaşabiliyorsunuz" 
                    : parseFloat(stats.notificationCoverage) >= 50 
                    ? "Kapsama oranınız orta seviyede, geliştirilebilir" 
                    : "Kapsama oranınız düşük, kullanıcıları bildirim açmaya teşvik edin"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kullanıcı Dağılımı */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Kullanıcı Dağılımı
            </CardTitle>
            <CardDescription>
              Bildirim durumuna göre kullanıcı analizi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Aktif Kullanıcılar */}
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Bildirim Alabilir</p>
                    <p className="text-xs text-green-600">Push token mevcut</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{stats.usersWithPushToken}</p>
                  <p className="text-xs text-green-600">%{stats.notificationCoverage}</p>
                </div>
              </div>

              {/* Bildirim Alamayan */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Bildirim Alamayan</p>
                    <p className="text-xs text-gray-600">Push token yok</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-600">
                    {(stats.totalUsers - stats.usersWithPushToken - stats.bannedUsers).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600">
                    %{(((stats.totalUsers - stats.usersWithPushToken - stats.bannedUsers) / stats.totalUsers) * 100).toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Yasaklı Kullanıcılar */}
              {stats.bannedUsers > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Yasaklı</p>
                      <p className="text-xs text-red-600">Engellenmiş kullanıcılar</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">{stats.bannedUsers}</p>
                    <p className="text-xs text-red-600">
                      %{((stats.bannedUsers / stats.totalUsers) * 100).toFixed(1)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Yenileme Butonu */}
      <div className="flex justify-end">
        <Button onClick={fetchStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          İstatistikleri Yenile
        </Button>
      </div>
    </div>
  );
}
