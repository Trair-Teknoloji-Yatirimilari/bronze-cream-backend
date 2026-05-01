"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  History, 
  Trash2, 
  Users, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  Eye,
  TrendingUp,
  TrendingDown,
  Clock
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  targetType: "all" | "specific";
  targetCount: number;
  sentCount: number;
  successCount: number;
  errorCount: number;
  successRate: string;
  adminEmail: string;
  customData: string | null;
  createdAt: string;
  createdAtRaw: string;
}

interface LogsResponse {
  success: boolean;
  data: NotificationLog[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export default function NotificationLogs({ token }: { token?: string }) {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filtreler
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("all_types");

  // Logları getir
  const fetchLogs = async (page = currentPage, targetType = targetTypeFilter) => {
    setLoading(true);
    try {
      const authToken = token || localStorage.getItem("adminToken");
      console.log("Logs - Auth token:", authToken ? "mevcut" : "bulunamadı");
      let url = `/api/dashboard/notification-logs?page=${page}&pageSize=20`;
      
      if (targetType !== "all_types") {
        url += `&targetType=${targetType}`;
      }

      console.log("Logs URL:", url);
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      
      console.log("Logs response status:", response.status);

      if (response.ok) {
        const result: LogsResponse = await response.json();
        console.log("Logs result:", result);
        setLogs(result.data);
        setCurrentPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
        setTotalCount(result.pagination.totalCount);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Logs API error:", response.status, errorData);
        toast.error(`Loglar yüklenirken hata oluştu (${response.status})`);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Loglar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Log sil
  const deleteLog = async (logId: string) => {
    setDeleting(logId);
    try {
      const authToken = token || localStorage.getItem("adminToken");
      const response = await fetch(`/api/dashboard/notification-logs?id=${logId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        toast.success("Log kaydı silindi");
        // Sayfa yenilenmesi yerine sadece silinen kaydı listeden çıkar
        setLogs(prev => prev.filter(log => log.id !== logId));
        setTotalCount(prev => prev - 1);
      } else {
        const error = await response.json();
        toast.error(error.message || "Log silinirken hata oluştu");
      }
    } catch (error) {
      console.error("Error deleting log:", error);
      toast.error("Log silinirken hata oluştu");
    } finally {
      setDeleting(null);
    }
  };

  // Filtre değiştiğinde
  const handleFilterChange = (value: string) => {
    setTargetTypeFilter(value);
    setCurrentPage(1);
    fetchLogs(1, value);
  };

  // Sayfa değiştiğinde
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchLogs(page);
  };

  // İlk yükleme
  useEffect(() => {
    fetchLogs();
  }, []);

  // Başarı oranına göre badge rengi
  const getSuccessRateBadge = (rate: string) => {
    const numRate = parseFloat(rate);
    if (numRate >= 90) return "bg-green-100 text-green-800 hover:bg-green-200";
    if (numRate >= 70) return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    return "bg-red-100 text-red-800 hover:bg-red-200";
  };

  // Hedef türüne göre badge
  const getTargetTypeBadge = (type: "all" | "specific") => {
    return type === "all" 
      ? { icon: Users, text: "Tüm Kullanıcılar", variant: "default" as const }
      : { icon: User, text: "Seçili Kullanıcılar", variant: "secondary" as const };
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Bildirim Logları
          </CardTitle>
          <CardDescription>
            Gönderilen bildirimlerin geçmişi ve istatistikleri
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={targetTypeFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_types">Tüm Türler</SelectItem>
              <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
              <SelectItem value="specific">Seçili Kullanıcılar</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Özet İstatistikler */}
        {!loading && logs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Toplam Log</p>
                    <p className="text-2xl font-bold">{totalCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Toplam Gönderim</p>
                    <p className="text-2xl font-bold text-green-600">
                      {logs.reduce((sum, log) => sum + log.sentCount, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Başarılı</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {logs.reduce((sum, log) => sum + log.successCount, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-sm font-medium">Hatalı</p>
                    <p className="text-2xl font-bold text-red-600">
                      {logs.reduce((sum, log) => sum + log.errorCount, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tablo */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Başlık & Mesaj</TableHead>
                <TableHead>Hedef</TableHead>
                <TableHead>İstatistikler</TableHead>
                <TableHead>Başarı Oranı</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Henüz bildirim gönderilmemiş
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const targetBadge = getTargetTypeBadge(log.targetType);
                  const TargetIcon = targetBadge.icon;
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium truncate max-w-48" title={log.title}>
                            {log.title}
                          </p>
                          <p className="text-sm text-muted-foreground truncate max-w-48" title={log.body}>
                            {log.body}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={targetBadge.variant} className="flex items-center gap-1 w-fit">
                          <TargetIcon className="h-3 w-3" />
                          {targetBadge.text}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>Hedef: {log.targetCount}</div>
                          <div>Gönderilen: {log.sentCount}</div>
                          <div className="flex gap-2">
                            <span className="text-green-600">✓ {log.successCount}</span>
                            <span className="text-red-600">✗ {log.errorCount}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={getSuccessRateBadge(log.successRate)}>
                          {log.successRate}%
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm">{log.adminEmail}</span>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm">{log.createdAt}</span>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Dialog open={isDetailOpen && selectedLog?.id === log.id} onOpenChange={(open) => {
                            setIsDetailOpen(open);
                            if (!open) setSelectedLog(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedLog(log);
                                  setIsDetailOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Bildirim Detayları</DialogTitle>
                                <DialogDescription>
                                  {log.createdAt} tarihinde gönderilen bildirim
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedLog && (
                                <div className="space-y-4">
                                  <div>
                                    <Label className="text-sm font-medium">Başlık</Label>
                                    <p className="text-sm bg-muted p-2 rounded">{selectedLog.title}</p>
                                  </div>
                                  
                                  <div>
                                    <Label className="text-sm font-medium">Mesaj</Label>
                                    <p className="text-sm bg-muted p-2 rounded">{selectedLog.body}</p>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Hedef Tür</Label>
                                      <p className="text-sm">{selectedLog.targetType === "all" ? "Tüm Kullanıcılar" : "Seçili Kullanıcılar"}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Admin</Label>
                                      <p className="text-sm">{selectedLog.adminEmail}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-4 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Hedeflenen</Label>
                                      <p className="text-lg font-bold">{selectedLog.targetCount}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Gönderilen</Label>
                                      <p className="text-lg font-bold">{selectedLog.sentCount}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Başarılı</Label>
                                      <p className="text-lg font-bold text-green-600">{selectedLog.successCount}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Hatalı</Label>
                                      <p className="text-lg font-bold text-red-600">{selectedLog.errorCount}</p>
                                    </div>
                                  </div>
                                  
                                  {selectedLog.customData && (
                                    <div>
                                      <Label className="text-sm font-medium">Özel Veri</Label>
                                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                                        {JSON.stringify(selectedLog.customData, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteLog(log.id)}
                            disabled={deleting === log.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deleting === log.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Toplam {totalCount} kayıt, sayfa {currentPage} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Önceki
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Sonraki
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
