"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

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

interface EditProductDialogProps {
  product: Product;
  token: string;
  onSuccess: () => void;
}

export default function EditProductDialog({ product, token, onSuccess }: EditProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description,
    price: product.price,
    link: product.link,
    isActive: product.isActive,
    isTrending: product.isTrending,
    isSoldOut: product.isSoldOut,
    isPopular: product.isPopular,
    hasFilterEvent: product.hasFilterEvent,
    filterColor: product.filterColor || "",
    intensity: product.intensity,
    filterType: product.filterType || "Color",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(product.imageUrl);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("id", product.id);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price.toString());
      formDataToSend.append("link", formData.link);
      formDataToSend.append("isActive", formData.isActive.toString());
      formDataToSend.append("isTrending", formData.isTrending.toString());
      formDataToSend.append("isSoldOut", formData.isSoldOut.toString());
      formDataToSend.append("isPopular", formData.isPopular.toString());
      formDataToSend.append("hasFilterEvent", formData.hasFilterEvent.toString());
      formDataToSend.append("filterColor", formData.filterColor);
      formDataToSend.append("intensity", formData.intensity.toString());
      formDataToSend.append("filterType", formData.filterType);

      if (selectedFile) {
        formDataToSend.append("file", selectedFile);
      }

      const response = await fetch("/api/products", {
        method: "PUT",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        toast.success("Ürün başarıyla güncellendi", {
          description: `${formData.name} başarıyla güncellendi`,
        });
        setOpen(false);
        onSuccess();
      } else {
        toast.error("Ürün güncellenirken bir hata oluştu", {
          description: result.message || "Ürün güncellenirken bir hata oluştu",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Ürün güncellenirken bir hata oluştu", {
        description: "Ağ hatası oluştu",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Dialog kapanırken formu sıfırla
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        link: product.link,
        isActive: product.isActive,
        isTrending: product.isTrending,
        isSoldOut: product.isSoldOut,
        isPopular: product.isPopular,
        hasFilterEvent: product.hasFilterEvent,
        filterColor: product.filterColor || "",
        intensity: product.intensity,
        filterType: product.filterType || "Color",
      });
      setSelectedFile(null);
      setPreviewUrl(product.imageUrl);
    }
    setOpen(newOpen);
  };

  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          onClick={(e) => e.stopPropagation()}
        >
          Düzenle
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={handleDialogClick}
      >
        <DialogHeader>
          <DialogTitle>Ürün Düzenle</DialogTitle>
          <DialogDescription>
            {product.name} ürününün bilgilerini güncelleyin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" onClick={handleDialogClick}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ürün Adı *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ürün adını girin"
                required
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Fiyat *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange("price", Number(e.target.value))}
                placeholder="0"
                min="0"
                step="0.01"
                required
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Ürün açıklamasını girin"
              rows={3}
              required
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Link *</Label>
            <Input
              id="link"
              value={formData.link}
              onChange={(e) => handleInputChange("link", e.target.value)}
              placeholder="https://example.com"
              required
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filterColor">Filtre Rengi</Label>
            <Input
              id="filterColor"
              type="color"
              value={formData.filterColor}
              onChange={(e) => handleInputChange("filterColor", e.target.value)}
              className="w-20 h-10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="intensity">Yoğunluk</Label>
            <Input
              id="intensity"
              type="number"
              value={formData.intensity}
              onChange={(e) => handleInputChange("intensity", Number(e.target.value))}
              placeholder="1.0"
              min="0.1"
              max="1.5"
              step="0.1"
              required
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filterType">Filtre Tipi</Label>
            <Select 
              value={formData.filterType} 
              onValueChange={(value: string) => handleInputChange("filterType", value)}
            >
              <SelectTrigger onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <SelectValue placeholder="Filtre tipi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Color">Normal</SelectItem>
                <SelectItem value="SoftLight">İnce</SelectItem>
                <SelectItem value="Overlay">Yoğun</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Görsel</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              onClick={(e) => e.stopPropagation()}
            />
            {previewUrl && (
              <div className="mt-2">
                <img
                  src={previewUrl}
                  alt="Önizleme"
                  className="w-32 h-32 object-cover rounded border"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <Label htmlFor="isActive">Aktif</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isTrending"
                checked={formData.isTrending}
                onCheckedChange={(checked) => handleInputChange("isTrending", checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <Label htmlFor="isTrending">Trend</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isSoldOut"
                checked={formData.isSoldOut}
                onCheckedChange={(checked) => handleInputChange("isSoldOut", checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <Label htmlFor="isSoldOut">Tükendi</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isPopular"
                checked={formData.isPopular}
                onCheckedChange={(checked) => handleInputChange("isPopular", checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <Label htmlFor="isPopular">Popüler</Label>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="hasFilterEvent"
              checked={formData.hasFilterEvent}
              onCheckedChange={(checked) => handleInputChange("hasFilterEvent", checked)}
              onClick={(e) => e.stopPropagation()}
            />
            <Label htmlFor="hasFilterEvent">Filtre Etkinliği</Label>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              onClick={(e) => e.stopPropagation()}
            >
              {loading ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 