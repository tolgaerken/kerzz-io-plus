# Notification Handler Sistemi

Bu dokümantasyon, uygulamada notification handler sisteminin nasıl çalıştığını ve nasıl kullanılacağını açıklar.

## Genel Bakış

Notification handler sistemi, Firebase Cloud Messaging (FCM) ile gelen bildirimleri işler ve uygulamanın durumuna göre farklı aksiyonlar alır:

- **Uygulama açıkken**: Kullanıcıya onay dialogu gösterir
- **Uygulama kapalıyken**: Direkt olarak ilgili sayfaya yönlendirir

## Sistem Mimarisi

### 1. Ana Handler (`handleNotification`)

```typescript
await notificationService.handleNotification(remoteMessage, isAppOpen);
```

Bu fonksiyon:
- Notification data'sını parse eder
- JSON string'leri otomatik olarak parse eder
- `fullDocument` ve `module` alanlarını kontrol eder
- Uygun module handler'ına yönlendirir

### 2. Module-Based Handler Sistemi

Sistem, farklı modüller için ayrı handler'lar kullanır:

```typescript
switch (module) {
  case 'sale':
    await this.handleSaleNotification(fullDocument, isAppOpen);
    break;
  // Diğer modüller buraya eklenebilir
}
```

### 3. Sale Module Handler

Sale modülü için özel handler:
- Satış numarasını kontrol eder
- Uygulama durumuna göre aksiyon alır
- SalesScreen'e yönlendirir ve arama yapar

## Notification Data Formatı

Notification'ın `data` alanında şu formatlar desteklenir:

### Format 1: fullDocument Obje Olarak

```json
{
  "data": {
    "module": "sale",
    "fullDocument": {
      "no": "12345",
      "company": "Örnek Şirket",
      "total": 1000
    }
  }
}
```

### Format 2: fullDocument Basit JSON String Olarak

```json
{
  "data": {
    "module": "sale",
    "fullDocument": "{\"id\":\"182b-79eb\",\"no\":\"10446\"}"
  }
}
```

### Format 3: fullDocument Karmaşık JSON String Olarak (Gerçek Format)

```json
{
  "data": {
    "timestamp": "2025-09-19T09:37:13.740Z",
    "module": "sale",
    "fullDocument": "\"\\\"{\\\\n  \\\\\\\"id\\\\\\\": \\\\\\\"182b-79eb\\\\\\\",\\\\n  \\\\\\\"no\\\\\\\": \\\\\\\"10446\\\\\\\"\\\\n}\\\"\"",
    "pushLogId": "",
    "source": "kerzz-ai-backend"
  }
}
```

**Not**: Sistem tüm formatları otomatik olarak handle eder. fullDocument JSON string olarak gelirse (çoklu escape karakterleri ile bile) otomatik olarak parse edilir. Maksimum 5 kez parse denemesi yapar.

## Kullanım Senaryoları

### 1. Uygulama Açıkken Notification Geldiğinde

```
Notification Gelir → handleForegroundMessage → handleNotification(message, true)
→ handleSaleNotification → showSaleNavigationDialog → Kullanıcı Onayı
→ navigateToSale → SalesScreen'e git ve arama yap
```

### 2. Uygulama Kapalıyken Notification'a Tıklandığında

```
Uygulama Açılır → getInitialNotification → handleNotification(message, false)
→ handleSaleNotification → navigateToSale → SalesScreen'e git ve arama yap
```

### 3. Background'da Notification Geldiğinde

```
Background Message → handleBackgroundMessage → handleNotification(message, false)
→ handleSaleNotification → navigateToSale (sonraki açılışta)
```

## Test Etme

Sistemi test etmek için console'da şu komutları kullanabilirsiniz:

```javascript
// Uygulama açıkken test (onay dialogu gösterir)
NotificationService.getInstance().testNotificationHandler("10446", true, 'object');

// Uygulama kapalıyken test (direkt yönlendirir)
NotificationService.getInstance().testNotificationHandler("10446", false, 'object');

// Basit JSON string formatında test
NotificationService.getInstance().testNotificationHandler("10446", true, 'simple-json');

// Karmaşık JSON string formatında test (gerçek notification formatı)
NotificationService.getInstance().testNotificationHandler("10446", true, 'complex-json');
```

## Yeni Modül Ekleme

Yeni bir modül eklemek için:

1. `handleModuleNotification` fonksiyonuna yeni case ekleyin:

```typescript
switch (module) {
  case 'sale':
    await this.handleSaleNotification(fullDocument, isAppOpen);
    break;
  case 'order': // Yeni modül
    await this.handleOrderNotification(fullDocument, isAppOpen);
    break;
}
```

2. Yeni handler fonksiyonunu implement edin:

```typescript
private async handleOrderNotification(orderData: any, isAppOpen: boolean): Promise<void> {
  // Order notification logic
}
```

## Önemli Notlar

- Sistem otomatik olarak başlatılır (`NotificationInitializer` ile)
- Initial notification kontrolü otomatik yapılır
- Tüm notification handler'lar async çalışır
- Hata durumlarında console'a log yazılır
- Web platformunda bazı özellikler desteklenmez

## Debugging

Notification handler sistemini debug etmek için:

1. Console loglarını takip edin
2. `showNotificationLoggingInfo()` fonksiyonunu çağırın
3. Test fonksiyonlarını kullanın
4. Firebase Console'dan test notification gönderin

## Entegrasyon

Sistem şu componentler ile entegre çalışır:

- `NotificationService`: Ana service
- `NotificationInitializer`: Başlatma component'i
- `SalesScreen`: Satış listesi ve arama
- `expo-router`: Sayfa yönlendirme
- `React Native Alert`: Onay dialogları
