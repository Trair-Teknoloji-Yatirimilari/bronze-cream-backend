# Push Notification API Dokümantasyonu

Bu API, Expo push notifications sistemi için mobil uygulamanızla entegrasyonu sağlar.

## API Endpoints

### 1. Push Token Kaydetme
**POST** `/api/dashboard/pushNotification`

Kullanıcının push token'ını kaydeder veya günceller.

#### Request Body:
```json
{
  "uniqueId": "kullanıcı_benzersiz_id",
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "deviceInfo": {
    "userAgent": "string",
    "deviceBrand": "string",
    "deviceName": "string",
    "systemName": "string",
    "systemVersion": "string",
    "appVersion": "string",
    "buildNumber": "string"
  }
}
```

#### Response:
```json
{
  "success": true,
  "message": "Push token başarıyla kaydedildi",
  "userId": "user_id"
}
```

### 2. Bildirim Gönderme (Admin)
**PUT** `/api/dashboard/pushNotification`

Admin yetkisi gerekir. Kullanıcılara push notification gönderir.

#### Headers:
```
Authorization: Bearer <admin_token>
```

#### Request Body:
```json
{
  "title": "Bildirim Başlığı",
  "body": "Bildirim mesajı",
  "targetType": "all", // veya "specific"
  "userIds": ["user_id1", "user_id2"], // targetType "specific" ise
  "data": {
    "customData": "value"
  }
}
```

#### Response:
```json
{
  "success": true,
  "message": "Bildirimler gönderildi",
  "totalTargeted": 100,
  "totalSent": 95,
  "successCount": 90,
  "errorCount": 5,
  "tickets": [...]
}
```

### 3. İstatistikleri Getirme (Admin)
**GET** `/api/dashboard/pushNotification`

Kullanıcı ve bildirim istatistiklerini getirir.

#### Headers:
```
Authorization: Bearer <admin_token>
```

#### Response:
```json
{
  "success": true,
  "stats": {
    "totalUsers": 1000,
    "usersWithPushToken": 800,
    "bannedUsers": 5,
    "recentUsers": 50,
    "notificationCoverage": "80.0"
  }
}
```

## Güvenlik Özellikleri

- **Rate Limiting**: IP başına dakikada 10 token kaydı, admin başına dakikada 100 bildirim
- **Input Validation**: Tüm giriş verileri doğrulanır
- **Admin Authentication**: Bildirim gönderme ve istatistik için admin yetkisi gerekli
- **Push Token Validation**: Expo push token formatı kontrol edilir
- **Banned User Check**: Engellenmiş kullanıcılara bildirim gönderilmez

## Expo Push Token Formatı

Geçerli push token formatı: `ExponentPushToken[A-Za-z0-9_-]+`

## Hata Kodları

- **400**: Geçersiz veriler
- **401**: Yetkisiz erişim
- **403**: Yasaklanmış erişim
- **404**: Kaynak bulunamadı
- **429**: Çok fazla istek
- **500**: Sunucu hatası

## Mobil Uygulama Entegrasyonu

### 1. Push Token Alma ve Kaydetme

```javascript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Push token alma
async function registerForPushNotifications() {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Push bildirimleri için izin gerekli!');
      return;
    }
    
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    
    // Token'ı backend'e gönder
    await savePushToken(token);
  }
}

// Backend'e token gönderme
async function savePushToken(pushToken) {
  const uniqueId = await getUniqueDeviceId(); // Cihaz benzersiz ID'si
  
  const deviceInfo = {
    userAgent: await Device.osName,
    deviceBrand: Device.brand,
    deviceName: Device.deviceName,
    systemName: Device.osName,
    systemVersion: Device.osVersion,
    // app version bilgileri...
  };

  try {
    const response = await fetch('YOUR_API_URL/api/dashboard/pushNotification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uniqueId,
        pushToken,
        deviceInfo
      }),
    });

    const result = await response.json();
    if (result.success) {
      console.log('Push token kaydedildi');
    }
  } catch (error) {
    console.error('Push token kaydetme hatası:', error);
  }
}
```

### 2. Bildirimleri Dinleme

```javascript
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

// Bildirim ayarları
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function App() {
  useEffect(() => {
    // Uygulama açıkken gelen bildirimler
    const notificationListener = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Bildirim alındı:', notification);
      }
    );

    // Bildirime tıklandığında
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      response => {
        console.log('Bildirime tıklandı:', response);
        // Özel veri varsa işle
        const customData = response.notification.request.content.data;
      }
    );

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  return (
    // Your app components
  );
}
```

## Notlar

- Push token'lar benzersizdir ve her cihaz için farklıdır
- Kullanıcı uygulamayı yeniden yüklerse token değişebilir
- Internet bağlantısı olmadan API çalışmaz (Expo servisleri gerekir)
- Prisma migration'ını çalıştırmayı unutmayın: `npx prisma migrate dev`
- Prisma client'ını yeniden generate edin: `npx prisma generate`
