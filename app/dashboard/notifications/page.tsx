import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, History } from "lucide-react";
import NotificationSender from "./components/notification-sender";
import NotificationLogs from "./components/notification-logs";
import NotificationStats from "./components/notification-stats";
import { cookies } from "next/headers";

export default async function Notifications() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value || "";
  return (
    <div className="flex flex-col gap-6 w-full h-full p-6">
      {/* Sayfa Başlığı */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Bildirim Yönetimi</h1>
        <p className="text-muted-foreground">
          Kullanıcılara push bildirim gönderin, logları takip edin ve istatistikleri görüntüleyin
        </p>
      </div>

      {/* Ana İçerik */}
      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-2 ">
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Bildirim Gönder
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Loglar
          </TabsTrigger>
        </TabsList>

        {/* Bildirim Gönderme Sekmesi */}
        <TabsContent value="send" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Sol Taraf - Bildirim Formu */}
            <div className="xl:col-span-2">
              <NotificationSender token={token} />
            </div>
            
            {/* Sağ Taraf - Hızlı İstatistikler */}
            <div className="xl:col-span-2">
              <NotificationStats token={token} />
            </div>
          </div>
        </TabsContent>

        {/* Loglar Sekmesi */}
        <TabsContent value="logs" className="space-y-6">
          <NotificationLogs token={token} />
        </TabsContent>

      </Tabs>
    </div>
  );
}
