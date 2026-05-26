"use client";

import { DataTable } from "./data-table";
import { RecentPhotos, columns } from "./columns";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Clock,
  Users,
  Eye,
  Image as ImageIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ColumnDef } from "@tanstack/react-table";

interface Props {
  initialData: RecentPhotos[];
  totalCount: number;
  pageSize: number;
  token: string;
}

interface Stats {
  total: number;
  public: number;
  private: number;
  active: number;
  inactive: number;
  last24h: number;
  last48h: number;
}

export default function RecentPhotosTableClient({
  initialData,
  totalCount,
  pageSize: initialPageSize,
  token,
}: Props) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(totalCount);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate time-based stats
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const stats: Stats = {
    total: total,
    public: data.filter((item) => item.isPublic).length,
    private: data.filter((item) => !item.isPublic).length,
    active: data.filter((item) => item.isActive).length,
    inactive: data.filter((item) => !item.isActive).length,
    last24h: data.filter((item) => new Date(item.uploadTime) >= last24h).length,
    last48h: data.filter((item) => new Date(item.uploadTime) >= last48h).length,
  };

  const fetchData = useCallback(
    (pageNum: number, newPageSize?: number, search?: string) => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: (newPageSize || pageSize).toString(),
        ...(search && { search }),
      });

      fetch(`/api/dashboard/recent-photos?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            if (res.status === 401) {
              throw new Error("Yetkiniz yok");
            }
            throw new Error("Veri alınamadı");
          }
          const json = await res.json();
          setData(json.data);
          setTotal(json.totalCount);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
    [pageSize]
  );

  useEffect(() => {
    if (page === 1 && pageSize === initialPageSize && !searchTerm) return;
    fetchData(page, pageSize, searchTerm);
  }, [page, pageSize, searchTerm, fetchData, initialPageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize));
    setPage(1);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  if (!mounted || (loading && data.length === 0)) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-7 w-64 mb-2" />
                <Skeleton className="h-4 w-80" />
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-8 w-12" />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full h-full">
      {/* Header Section */}
      <div className="w-full h-full flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-2xl">
                <ImageIcon className="h-6 w-6 text-blue-600" />
                Yüklenen Fotoğraflar
              </div>
              <p>Tüm yüklenen fotoğrafları görüntüleyin ve yönetin</p>
            </div>
          </div>
        </div>
        <div>
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Toplam</span>
              </div>
              <span className="text-2xl font-bold text-blue-900">
                {stats.total}
              </span>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
              <div className="flex items-center gap-2 text-emerald-700 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Son 24 Saat</span>
              </div>
              <span className="text-2xl font-bold text-emerald-900">
                {stats.last24h}
              </span>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">Herkese Açık</span>
              </div>
              <span className="text-2xl font-bold text-green-900">
                {stats.public}
              </span>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-teal-50 to-teal-100">
              <div className="flex items-center gap-2 text-teal-700 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Aktif</span>
              </div>
              <span className="text-2xl font-bold text-teal-900">
                {stats.active}
              </span>
            </div>
            <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center gap-2 text-purple-700 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Son 48 Saat</span>
              </div>
              <span className="text-2xl font-bold text-purple-900">
                {stats.last48h}
              </span>
            </div>
          </div>

          {/* Filters Section */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Fotoğraf ara (ürün adı, kullanıcı id, ip vs.)..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
              {error}
            </div>
          )}

          {/* Data Table */}
          <DataTable
            columns={columns as ColumnDef<RecentPhotos>[]}
            data={data}
            loading={loading}
            token={token}
          />

          {/* Modern Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                <span className="font-medium">
                  {Math.min((page - 1) * pageSize + 1, total)}
                </span>
                {" - "}
                <span className="font-medium">
                  {Math.min(page * pageSize, total)}
                </span>
                {" / "}
                <span className="font-medium">{total}</span> sonuç
              </span>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Sayfa başına:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Önceki
              </Button>

              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = Math.max(1, page - 2) + i;
                  if (pageNum > totalPages) return null;

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      disabled={loading}
                      className="min-w-[40px]"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={loading || page >= totalPages}
                className="gap-1"
              >
                Sonraki
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
