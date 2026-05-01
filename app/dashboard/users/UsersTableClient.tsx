"use client";

import { DataTable } from "./data-table";
import { Users, columns } from "./columns";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  initialData: Users[];
  totalCount: number;
  pageSize: number;
  token: string;
}



export default function UsersTableClient({
  initialData,
  totalCount,
  pageSize,
  token,
}: Props) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(totalCount);

  const fetchData = useCallback(
    (pageNum: number) => {
      setLoading(true);
      setError(null);

      if (!token) {
        setError("Authentication gerekli");
        setLoading(false);
        return;
      }

      fetch(`/api/dashboard/users?page=${pageNum}&pageSize=${pageSize}`, {
        headers: {
          Authorization: `Bearer ${token}`,
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
    if (page === 1) return;
    fetchData(page);
  }, [page, fetchData]);

  // Veriyi tekrar çekmek için fonksiyon
  const refetch = useCallback(() => {
    fetchData(page);
  }, [fetchData, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      {/* Hata Mesajı */}
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-lg border border-destructive/20">
          <p className="text-sm font-medium">Hata: {error}</p>
        </div>
      )}

      {/* Tablo */}
      <div className="relative">
        <DataTable
          columns={
            columns as unknown as import("@tanstack/react-table").ColumnDef<
              unknown,
              unknown
            >[]
          }
          data={data}
          loading={loading}
          onRefetch={refetch}
          token={token}
        />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Yükleniyor...</span>
            </div>
          </div>
        )}
      </div>

      {/* Pagination ve Bilgi */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Sayfa Bilgisi */}
        <div className="text-sm text-muted-foreground">
          {total > 0 ? (
            <>
              <span className="font-medium">
                {startItem.toLocaleString("tr-TR")}
              </span>
              {" - "}
              <span className="font-medium">
                {endItem.toLocaleString("tr-TR")}
              </span>
              {" / "}
              <span className="font-medium">
                {total.toLocaleString("tr-TR")}
              </span>
              {" kullanıcı gösteriliyor"}
            </>
          ) : (
            "Kullanıcı bulunamadı"
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Önceki
          </Button>

          {/* Sayfa Numaraları */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  disabled={loading}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={loading || page >= totalPages}
            className="flex items-center gap-1"
          >
            Sonraki
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Toplam Sayfa Bilgisi */}
      <div className="text-center">
        <Badge variant="secondary" className="text-xs">
          Sayfa {page} / {totalPages}
        </Badge>
      </div>
    </div>
  );
}
