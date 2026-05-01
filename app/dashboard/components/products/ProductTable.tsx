"use client";
import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import React from "react";
import { toast } from "sonner";
import EditProductDialog from "./EditProductDialog";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  link: string;
  isActive: boolean;
  isTrending: boolean;
  isSoldOut: boolean;
  isPopular: boolean;
  hasFilterEvent: boolean;
  filterColor?: string;
  intensity: number;
  filterType: string;
  createdAt: string;
  updatedAt: string;
  photoCount?: number;
}

interface ProductTableProps {
  initialData?: Product[];
  token?: string;
}

const ProductTable = forwardRef(function ProductTable(props: ProductTableProps, ref) {
  const [products, setProducts] = useState<Product[]>(props.initialData || []);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products?product=all");
      const json = await res.json();
      if (json.ok) setProducts(json.products);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({ refetch: fetchProducts }), []);

  useEffect(() => {
    if (!props.initialData) fetchProducts();
  }, [props.initialData]);

  const handleDelete = async (productId: string, productName: string) => {
    if (!props.token) {
      toast.error("Bu işlem için yetki gerekli");
      return;
    }

    if (deletingId) return; // Zaten silme işlemi devam ediyor

    setDeletingId(productId);
    
    try {
      const response = await fetch("/api/products", {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${props.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: productId }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.ok) {
        toast.success("Ürün başarıyla silindi", {
          description: `${productName} başarıyla silindi`,
        });
        // Ürünü listeden kaldır
        setProducts(prev => prev.filter(p => p.id !== productId));
      } else {
        toast.error("Ürün silinirken bir hata oluştu", {
          description: result.message || "Ürün silinirken bir hata oluştu",
        });
      }
    } catch (error) {
      console.log(error);
      toast.error("Ürün silinirken bir hata oluştu", {
        description: "Ağ hatası oluştu",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border">
      <h2 className="text-lg font-semibold mb-4">Ürünler</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Adı</TableHead>
            <TableHead>Fiyat</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Kullanım</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <React.Fragment key={product.id}>
              <TableRow
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setOpenId(openId === product.id ? null : product.id)}
              >
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.price.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</TableCell>
                <TableCell>
                  {product.isActive ? <Badge>Aktif</Badge> : <Badge variant="outline">Pasif</Badge>}
                </TableCell>
                <TableCell>
                  {typeof product.photoCount === "number" ? (
                    <Badge variant="secondary">{product.photoCount} fotoğraf</Badge>
                  ) : (
                    <span>-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <EditProductDialog 
                      product={product} 
                      token={props.token || ""} 
                      onSuccess={fetchProducts}
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          disabled={deletingId === product.id}
                        >
                          {deletingId === product.id ? "Siliniyor..." : "Sil"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Ürünü silmek istediğinize emin misiniz?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            <strong>{product.name}</strong> ürününü silmek üzeresiniz. Bu işlem geri alınamaz ve ürün kalıcı olarak silinecektir.
                            {product.photoCount && product.photoCount > 0 && (
                              <div className="mt-2 text-orange-600">
                                ⚠️ Bu ürünle ilişkili {product.photoCount} fotoğraf da silinecektir.
                              </div>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(product.id, product.name)}
                            disabled={deletingId === product.id}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deletingId === product.id ? "Siliniyor..." : "Evet, Sil"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
              {openId === product.id && (
                <TableRow className="bg-muted/20" key={product.id + "-details"}>
                  <TableCell colSpan={6} className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      <img src={product.imageUrl} alt={product.name} className="w-32 h-32 object-cover rounded border" />
                      <div className="flex-1 space-y-2">
                        <div><b>Açıklama:</b> {product.description}</div>
                        <div className="flex flex-wrap gap-2">
                          {product.isTrending && <Badge variant="secondary">Trend</Badge>}
                          {product.isSoldOut && <Badge variant="destructive">Tükendi</Badge>}
                          {product.isPopular && <Badge variant="outline">Popüler</Badge>}
                          {product.hasFilterEvent && <Badge>Filtre Etkinliği</Badge>}
                          {product.filterColor && <Badge style={{background: product.filterColor, color: '#fff'}} title={product.filterColor}>Filtre Renk</Badge>}
                          <Badge variant="secondary">Filtre Tipi: {product.filterType === "Color" ? "Normal" : product.filterType === "SoftLight" ? "İnce" : "Yoğun"}</Badge>
                          {product.intensity && <Badge variant="outline">Yoğunluk: {product.intensity}</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">Oluşturulma: {new Date(product.createdAt).toLocaleString("tr-TR")}</div>
                        <div className="text-xs text-muted-foreground">Güncelleme: {new Date(product.updatedAt).toLocaleString("tr-TR")}</div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
          {products.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={6} className="text-center">Hiç ürün yok.</TableCell>
            </TableRow>
          )}
          {loading && (
            <TableRow>
              <TableCell colSpan={6} className="text-center">Yükleniyor...</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
});

export default ProductTable; 