# CarPlay Bildirimleri - Kullanım Kılavuzu

## 📱 Genel Bakış

iOS push bildirimleri artık CarPlay uyumlu olacak şekilde yapılandırıldı. Bu sayede kullanıcılar araç içindeyken de bildirimleri CarPlay ekranında görebilecek.

## ✅ Yapılan Değişiklikler

### 1. iOS Bildirim İzinleri (notificationService.ts)
- `carPlay: true` parametresi eklendi
- iOS bildirim izni istenirken CarPlay desteği aktif hale getirildi

### 2. AppDelegate.swift - Bildirim Kategorileri
Aşağıdaki CarPlay uyumlu bildirim kategorileri tanımlandı:
- `MESSAGE_CATEGORY` - Mesaj bildirimleri
- `SALE_CATEGORY` - Satış bildirimleri
- `OPPORTUNITY_CATEGORY` - Fırsat bildirimleri
- `BANK_TRANSACTION_CATEGORY` - Banka hareketi bildirimleri
- `GENERAL_CATEGORY` - Genel bildirimler

Tüm kategoriler `.allowInCarPlay` seçeneği ile yapılandırıldı.

## 🚀 Bildirim Gönderme

### FCM Payload Formatı

CarPlay'de görünmesi için bildirim gönderilirken **category ID** belirtilmesi gerekiyor:

```json
{
  "notification": {
    "title": "Yeni Satış",
    "body": "1234 numaralı satış onaylandı"
  },
  "data": {
    "module": "sale",
    "fullDocument": "{...}"
  },
  "apns": {
    "payload": {
      "aps": {
        "category": "SALE_CATEGORY",
        "sound": "default"
      }
    }
  }
}
```

### Kategori ID'leri

Her bildirim türü için uygun category ID kullanın:

| Bildirim Türü | Category ID |
|--------------|-------------|
| Satış | `SALE_CATEGORY` |
| Fırsat | `OPPORTUNITY_CATEGORY` |
| Banka Hareketi | `BANK_TRANSACTION_CATEGORY` |
| Mesaj | `MESSAGE_CATEGORY` |
| Genel | `GENERAL_CATEGORY` |

### Örnek: Node.js/Firebase Admin SDK

```javascript
const message = {
  notification: {
    title: 'Yeni Fırsat',
    body: 'ABC Şirketi için yeni fırsat atandı'
  },
  data: {
    module: 'opportunity',
    fullDocument: JSON.stringify(opportunityData)
  },
  apns: {
    payload: {
      aps: {
        category: 'OPPORTUNITY_CATEGORY',
        sound: 'default',
        'mutable-content': 1
      }
    }
  },
  token: userFCMToken
};

await admin.messaging().send(message);
```

### Örnek: HTTP API

```bash
curl -X POST https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "USER_FCM_TOKEN",
      "notification": {
        "title": "Yeni Banka Hareketi",
        "body": "5000 TL tutarında yeni işlem"
      },
      "data": {
        "module": "bank-transaction",
        "fullDocument": "{...}"
      },
      "apns": {
        "payload": {
          "aps": {
            "category": "BANK_TRANSACTION_CATEGORY",
            "sound": "default"
          }
        }
      }
    }
  }'
```

## 🧪 Test Etme

### 1. Fiziksel Cihaz Gerekli
⚠️ **Önemli**: CarPlay simülatörde tam olarak test edilemez. Gerçek bir CarPlay bağlantısı veya CarPlay destekli araç gereklidir.

### 2. CarPlay Bağlantısı
- iPhone'u CarPlay destekli bir araca bağlayın (kablolu veya kablosuz)
- Veya Xcode'da CarPlay simülatörünü kullanın (sınırlı özellikler)

### 3. Test Bildirimi Gönderme

Firebase Console veya backend'den category ID'li bir bildirim gönderin:

```javascript
// Test bildirimi - Backend'den
const testNotification = {
  notification: {
    title: "Test Bildirimi",
    body: "CarPlay test için bildirim"
  },
  apns: {
    payload: {
      aps: {
        category: "GENERAL_CATEGORY",
        sound: "default"
      }
    }
  },
  token: "YOUR_TEST_DEVICE_FCM_TOKEN"
};
```

### 4. Doğrulama
- Bildirimin iPhone'da göründüğünü kontrol edin
- CarPlay ekranında bildirimin göründüğünü kontrol edin
- Bildirimi CarPlay'den tıklayıp uygulamanın açıldığını kontrol edin

## 📝 Notlar

1. **İzin Gerekli**: Kullanıcının hem bildirim hem de CarPlay izni vermesi gerekiyor
2. **Category Zorunlu**: CarPlay'de gösterilmesi için `category` parametresi zorunludur
3. **Ses Desteği**: CarPlay'de sesli bildirimler de desteklenir
4. **Güvenlik**: Sürüş güvenliği için bildirimler CarPlay'de basit ve okunabilir olmalıdır

## 🔧 Sorun Giderme

### Bildirimler CarPlay'de görünmüyor
1. Category ID'nin doğru ayarlandığını kontrol edin
2. iOS izinlerinin verildiğini kontrol edin:
   ```
   Settings > Notifications > Your App > CarPlay
   ```
3. AppDelegate'de kategorilerin düzgün kayıtlı olduğunu kontrol edin
4. FCM payload'ında `apns.payload.aps.category` alanının olduğunu kontrol edin

### Debug
```swift
// AppDelegate.swift içinde kategori kontrolü
UNUserNotificationCenter.current().getNotificationCategories { categories in
    print("📋 Kayıtlı kategoriler:", categories.map { $0.identifier })
}
```

## 🔗 Kaynaklar

- [Apple CarPlay Notifications Guide](https://developer.apple.com/documentation/usernotifications/unnotificationcategory)
- [Firebase Cloud Messaging - APNs Payload](https://firebase.google.com/docs/cloud-messaging/ios/send-message)
- [UNNotificationCategory Options](https://developer.apple.com/documentation/usernotifications/unnotificationcategoryoptions)
