# Bronze Effect API Dokümantasyonu

Bu API, yüklenen görsellere bronz efekti uygulayan bir Next.js endpoint'idir.

## Kurulum

### Gerekli Kütüphaneler

```bash
npm install sharp node-cron
npm install --save-dev @types/node-cron
```

### Klasör Yapısı

API otomatik olarak aşağıdaki klasörleri oluşturur:
- `public/original/` - Orijinal görseller için
- `public/filtered/` - İşlenmiş görseller için

## API Endpoint'leri

### GET `/api/public/phone/bronze-effect`

API'nin çalışıp çalışmadığını kontrol eder.

**Yanıt:**
```json
{
  "message": "Bronze effect API is running"
}
```

### POST `/api/public/phone/bronze-effect`

Görsele bronz efekti uygular.

**İstek Formatı:** `multipart/form-data`

**Parametreler:**
- `image` (File) - İşlenecek görsel dosyası
- `mask` (String) - JSON formatında koordinat dizisi
- `selectedProduct` (String) - JSON formatında ürün bilgisi

**Mask Formatı:**
```json
[
  {"x": 100, "y": 100},
  {"x": 101, "y": 100},
  {"x": 102, "y": 100}
]
```

**SelectedProduct Formatı:**
```json
{
  "color": "#D2691E"
}
```
veya
```json
{
  "color": [210, 105, 30]
}
```

**Başarılı Yanıt:**
```json
{
  "success": true,
  "imageUrl": "/filtered/filtered-1672531200000-abcd1234.png",
  "originalColor": [200, 160, 120],
  "productColor": [210, 105, 30],
  "blendedColor": [205, 132, 75]
}
```

**Hata Yanıtı:**
```json
{
  "error": "image is required"
}
```

## Özellikler

### Renk Analizi
- En çok tekrar eden renk tespiti
- Gri tonların filtrelenmesi
- Çok koyu/açık renklerin filtrelenmesi

### Doku Koruması
- Orijinal görsel dokusunun korunması
- %80 doku koruma faktörü

### Otomatik Temizlik
- 15 günde bir eski dosyaların silinmesi
- Cron job ile otomatik çalışma

## Cron Job

`cronJob.ts` dosyası ayrı olarak çalıştırılarak otomatik dosya temizleme işlemi başlatılabilir:

```typescript
import { startCleanupCronJob, manualCleanup } from './cronJob';

// Otomatik temizleme başlat
startCleanupCronJob();

// Manuel temizleme
manualCleanup();
```

## Test

`test-bronze-api.html` dosyasını tarayıcıda açarak API'yi test edebilirsiniz:

1. Sunucuyu başlatın: `npm run dev`
2. `test-bronze-api.html` dosyasını tarayıcıda açın
3. GET test butonuyla API durumunu kontrol edin
4. Bir görsel yükleyerek POST testini yapın

## Güvenlik

- Dosya yükleme limiti: 10MB
- Sadece görsel dosyaları kabul edilir
- Mask ve ürün verileri JSON formatında doğrulanır

## Performans

- Sharp kütüphanesi ile yüksek performanslı görsel işleme
- Buffer kullanımı ile bellek optimizasyonu
- UUID ile benzersiz dosya isimlendirme

## Hata Yönetimi

- Detaylı hata mesajları
- JSON parse hataları yakalanır
- Dosya işleme hatalarında güvenli fallback 