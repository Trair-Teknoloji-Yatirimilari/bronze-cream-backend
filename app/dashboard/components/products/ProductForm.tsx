"use client";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductFormProps {
  onProductAdded?: () => void;
  token: string;
}

export default function ProductForm({ onProductAdded, token }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [isActive, setIsActive] = useState(true);
  const [isTrending, setIsTrending] = useState(false);
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [hasFilterEvent, setHasFilterEvent] = useState(false);
  const [intensity, setIntensity] = useState(1.0);
  const [filterType, setFilterType] = useState("Color");
  const [imagePreview, setImagePreview] = useState("");

  // Görsel seçilince preview ve ileride upload için
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(formRef.current!);
    formData.set("isActive", isActive.toString());
    formData.set("isTrending", isTrending.toString());
    formData.set("isSoldOut", isSoldOut.toString());
    formData.set("isPopular", isPopular.toString());
    formData.set("hasFilterEvent", hasFilterEvent.toString());
    formData.set("intensity", intensity.toString());
    formData.set("filterType", filterType);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Ürün başarıyla eklendi");
        formRef.current?.reset();
        setImagePreview("");
        setIsActive(true);
        setIsTrending(false);
        setIsSoldOut(false);
        setIsPopular(false);
        setHasFilterEvent(false);
        setIntensity(1.0);
        setFilterType("Color");
        onProductAdded?.();
      } else {
        toast.error(json.message || "Bir hata oluştu");
      }
    } catch (err: Error | unknown) {
      console.error(err);
      toast.error("Bir hata oluştu");
    }
    setLoading(false);
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow p-6 flex flex-col gap-4 border"
    >
      <h2 className="text-lg font-semibold mb-2">Yeni Ürün Ekle</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input name="name" placeholder="Ürün Adı" required />
        <Input
          name="price"
          placeholder="Fiyat"
          type="number"
          step="0.01"
          required
        />
        {/* Görsel yükleme alanı */}
        <div className="flex flex-col gap-2">
          <Label>Görsel Yükle</Label>
          <Input
            type="file"
            name="file"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Seçilen görsel"
              className="w-24 h-24 object-cover rounded border mt-2"
            />
          ) : (
            <p>Görsel seçin</p>
          )}
        </div>
        <Input name="link" placeholder="Satın Alma Linki" required />
        <Input
          name="filterColor"
          placeholder="Filtre Rengi (opsiyonel)"
          disabled={!hasFilterEvent}
        />
        <Input
          name="intensity"
          placeholder="Yoğunluk"
          type="number"
          step="0.1"
          min="0.1"
          max="1.5"
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          required
        />
        <div className="space-y-2">
          <Label htmlFor="filterType">Filtre Tipi</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Filtre tipi seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Color">Normal</SelectItem>
              <SelectItem value="SoftLight">İnce</SelectItem>
              <SelectItem value="Overlay">Yoğun</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea name="description" placeholder="Açıklama" required rows={3} />
      </div>
      <div className="flex flex-wrap gap-6 mt-2 justify-around">
        <div className="flex items-center gap-2">
          <Label htmlFor="isActive">Aktif</Label>
          <Switch
            id="isActive"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="hasFilterEvent">Filtre Etkinliği</Label>
          <Switch
            id="hasFilterEvent"
            checked={hasFilterEvent}
            onCheckedChange={setHasFilterEvent}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="isTrending">Trend</Label>
          <Switch
            id="isTrending"
            checked={isTrending}
            onCheckedChange={setIsTrending}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="isSoldOut">Tükendi</Label>
          <Switch
            id="isSoldOut"
            checked={isSoldOut}
            onCheckedChange={setIsSoldOut}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="isPopular">Popüler</Label>
          <Switch
            id="isPopular"
            checked={isPopular}
            onCheckedChange={setIsPopular}
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="mt-2 w-full md:w-auto"
      >
        {loading ? "Ekleniyor..." : "Ürünü Ekle"}
      </Button>
    </form>
  );
}
