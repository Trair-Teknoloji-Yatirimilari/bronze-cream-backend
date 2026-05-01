"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Send, Users, User, X, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface User {
  id: string;
  userIP: string;
  device: string;
  uniqueId: string;
  createdAt: string;
}

interface NotificationForm {
  title: string;
  body: string;
  targetType: "all" | "specific";
  selectedUsers: User[];
  customData: string;
}

interface SendResponse {
  success: boolean;
  message: string;
  totalTargeted: number;
  totalSent: number;
  successCount: number;
  errorCount: number;
}

export default function NotificationSender({ token }: { token: string }) {
  const [form, setForm] = useState<NotificationForm>({
    title: "",
    body: "",
    targetType: "all",
    selectedUsers: [],
    customData: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Kullanıcıları getir
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      console.log("Admin token:", token ? "mevcut" : "bulunamadı");
      
      const response = await fetch("/api/dashboard/users?pageSize=100", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      console.log("Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Users data:", data);
        setUsers(data.data || []);
        toast.success(`${data.data?.length || 0} kullanıcı yüklendi`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", response.status, errorData);
        toast.error(`Kullanıcılar yüklenirken hata oluştu (${response.status})`);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Kullanıcılar yüklenirken hata oluştu");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (form.targetType === "specific") {
      fetchUsers();
    }
  }, [form.targetType]);

  // Bildirim gönder
  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Başlık ve mesaj alanları zorunludur");
      return;
    }

    if (form.targetType === "specific" && form.selectedUsers.length === 0) {
      toast.error("Lütfen en az bir kullanıcı seçin");
      return;
    }

    setLoading(true);
    try {
      console.log("Sending notification with token:", token ? "mevcut" : "bulunamadı");
      console.log("Form data:", form);
      
      let customData = {};
      if (form.customData.trim()) {
        try {
          customData = JSON.parse(form.customData);
        } catch (e: Error | unknown) {
          toast.error("Özel veri geçerli bir JSON formatında olmalıdır");
          console.error("Error parsing custom data:", e);
          setLoading(false);
          return;
        }
      }

      const payload = {
        title: form.title,
        body: form.body,
        targetType: form.targetType,
        ...(form.targetType === "specific" && {
          userIds: form.selectedUsers.map(u => u.id)
        }),
        ...(Object.keys(customData).length > 0 && { data: customData })
      };

      console.log("Payload:", payload);

      const response = await fetch("/api/dashboard/pushNotification", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log("Response status:", response.status);
      const result: SendResponse = await response.json();
      console.log("Response result:", result);

      if (response.ok && result.success) {
        toast.success(
          `Bildirim başarıyla gönderildi! ${result.successCount}/${result.totalSent} başarılı`
        );
        
        // Formu temizle
        setForm({
          title: "",
          body: "",
          targetType: "all",
          selectedUsers: [],
          customData: ""
        });
      } else {
        toast.error(result.message || "Bildirim gönderilirken hata oluştu");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Bildirim gönderilirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı ekle
  const addUser = (user: User) => {
    if (!form.selectedUsers.find(u => u.id === user.id)) {
      setForm(prev => ({
        ...prev,
        selectedUsers: [...prev.selectedUsers, user]
      }));
    }
  };

  // Kullanıcı çıkar
  const removeUser = (userId: string) => {
    setForm(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.filter(u => u.id !== userId)
    }));
  };

  // Kullanıcı arama - daha güvenli ve kapsamlı
  const filteredUsers = users.filter(user => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    const matches = (
      user.userIP?.toLowerCase().includes(searchLower) ||
      user.device?.toLowerCase().includes(searchLower) ||
      user.uniqueId?.toLowerCase().includes(searchLower) ||
      user.createdAt?.toLowerCase().includes(searchLower)
    );
    
    return matches;
  });

  // Debug için
  console.log("Total users:", users.length);
  console.log("Search term:", searchTerm);
  console.log("Filtered users:", filteredUsers.length);

  // Token kontrol için
  const hasToken = !!token;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Bildirim Gönder
          {!hasToken && <span className="text-red-500 text-sm">(Token Yok)</span>}
        </CardTitle>
        <CardDescription>
          Kullanıcılara push bildirim gönderin
          {!hasToken && (
            <div className="text-red-500 text-sm mt-1">
              ⚠️ Admin token bulunamadı. Lütfen tekrar giriş yapın.
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Başlık */}
        <div className="space-y-2">
          <Label htmlFor="title">Başlık *</Label>
          <Input
            id="title"
            placeholder="Bildirim başlığı"
            value={form.title}
            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            {form.title.length}/100 karakter
          </p>
        </div>

        {/* Mesaj */}
        <div className="space-y-2">
          <Label htmlFor="body">Mesaj *</Label>
          <Textarea
            id="body"
            placeholder="Bildirim mesajı"
            value={form.body}
            onChange={(e) => setForm(prev => ({ ...prev, body: e.target.value }))}
            maxLength={500}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {form.body.length}/500 karakter
          </p>
        </div>

        {/* Hedef Seçimi */}
        <div className="space-y-2">
          <Label>Hedef Kullanıcılar</Label>
          <Select
            value={form.targetType}
            onValueChange={(value: "all" | "specific") => 
              setForm(prev => ({ ...prev, targetType: value, selectedUsers: [] }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Tüm Kullanıcılar
                </div>
              </SelectItem>
              <SelectItem value="specific">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Seçili Kullanıcılar
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Kullanıcı Seçimi */}
        {form.targetType === "specific" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Seçili Kullanıcılar ({form.selectedUsers.length})</Label>
              <Dialog open={isUserDialogOpen} onOpenChange={(open) => {
                setIsUserDialogOpen(open);
                if (!open) {
                  setSearchTerm(""); // Dialog kapandığında arama terimini temizle
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Kullanıcı Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Kullanıcı Seç</DialogTitle>
                    <DialogDescription>
                      Bildirim gönderilecek kullanıcıları seçin
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <Input
                      placeholder="IP, cihaz, ID veya tarih ile ara..."
                      value={searchTerm}
                      onChange={(e) => {
                        console.log("Search term changing from", searchTerm, "to", e.target.value);
                        setSearchTerm(e.target.value);
                      }}
                    />
                    
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {loadingUsers ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="text-center text-muted-foreground p-4">
                          <p>Kullanıcı bulunamadı</p>
                          <p className="text-xs mt-1">
                            Toplam: {users.length}, Arama: &quot;{searchTerm}&quot;
                          </p>
                        </div>
                      ) : (
                        filteredUsers.map((user) => {
                          const isSelected = form.selectedUsers.find(u => u.id === user.id);
                          return (
                            <div
                              key={user.id}
                              className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                                isSelected ? "bg-primary/10 border-primary" : ""
                              }`}
                              onClick={() => {
                                if (isSelected) {
                                  removeUser(user.id);
                                } else {
                                  addUser(user);
                                }
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{user.userIP}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {user.device} • {user.createdAt}
                                  </p>
                                </div>
                                {isSelected && (
                                  <Badge variant="secondary">Seçili</Badge>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Seçili kullanıcıları göster */}
            {form.selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.selectedUsers.map((user) => (
                  <Badge key={user.id} variant="secondary" className="gap-1">
                    {user.userIP} ({user.device})
                    <button
                      onClick={() => removeUser(user.id)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Özel Veri */}
        <div className="space-y-2">
          <Label htmlFor="customData">Özel Veri (JSON - Opsiyonel)</Label>
          <Textarea
            id="customData"
            placeholder='{"key": "value", "action": "open_page"}'
            value={form.customData}
            onChange={(e) => setForm(prev => ({ ...prev, customData: e.target.value }))}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Bildirimle birlikte gönderilecek özel veriler (JSON formatında)
          </p>
          <p className="text-xs text-muted-foreground">
          {`Uygulama içerisinde bir yönlendirme veya bir websitesi açmak için özel parametreler gönderilmektedir! Eğer bu özelliği kullanmak istiyorsanız aşağıdaki örnek kullanımı kullanabilirsiniz.`}
          </p>
          <p className="text-xs text-muted-foreground"> 
            {`Örnek kullanım: {"hasGoToUrl":true, "url":"https://www.edataspinar.com"}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {`Örnek kullanım: {"route":"PhotoEdit"} (Gerçek zamanlı filtreleme ekranı için:RealTimeScreen, Düzenle ve Ön izleme ekranı için:PhotoEdit)`}
          </p>
        </div>

        {/* Gönder Butonu */}
        <Button 
          onClick={handleSend} 
          disabled={loading || !form.title.trim() || !form.body.trim()}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Bildirim Gönder
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
