# Notification Module

Bu modül, React Native Expo uygulaması için kapsamlı bir push notification sistemi sağlar. Firebase Cloud Messaging (FCM) ve Expo Notifications kullanarak hem iOS hem de Android platformlarında çalışır.

## Özellikler

- 🔔 Push notification desteği (FCM)
- 📱 Local notification desteği
- 🎯 Notification kategorileri ve filtreleme
- ⚙️ Kullanıcı ayarları yönetimi
- 🔢 Badge count yönetimi
- 📊 Notification geçmişi ve okundu/okunmadı durumu
- 🎨 Özelleştirilebilir notification görünümü
- 🔗 Deep linking desteği
- 🚀 Background ve foreground notification handling

## Özel Bildirim Sesleri (Android + iOS)

Uygulamaya özel sesler eklendi ve push notification'larda kullanılabilir:

- Android: `res/raw` içine kopyalandı ve sesli kanallar oluşturuldu.
- iOS: `ios/kerzzioplus/NotificationSounds/` klasörüne kopyalandı. Xcode'da projeye kaynak olarak ekli olduğundan emin olun (Target Membership: kerzzioplus).

Desteklenen sesler (dosya adları):

```
approve_request.mp3
money.mp3
new_oppo.mp3
notify1.mp3
notify2.mp3
notify3-money.mp3
notify4.mp3
```

### Kullanım (FCM Payload)

- Android: `data.sound` alanı verildiğinde uygun kanal otomatik seçilir ve kanalın sesi çalar.
- iOS: `aps.sound` alanına dosya adı (`.mp3` uzantısı olmadan da verilebilir) yazılmalıdır.

Örnek Android/iOS uyumlu FCM mesajı:

```json
{
  "to": "<DEVICE_FCM_TOKEN>",
  "notification": {
    "title": "Yeni Fırsat",
    "body": "Size yeni bir fırsat atandı"
  },
  "data": {
    "module": "opportunity",
    "fullDocument": "{\"id\":\"opp-1\",\"no\":\"10446\"}",
    "sound": "new_oppo"
  },
  "apns": {
    "payload": {
      "aps": {
        "sound": "new_oppo"
      }
    }
  }
}
```

Android'de `sound` → kanal eşleşmeleri:

```
approve_request -> sound_approve_request
money           -> sound_money
new_oppo        -> sound_new_oppo
notify1         -> sound_notify1
notify2         -> sound_notify2
notify3_money   -> sound_notify3_money
notify4         -> sound_notify4
```

Notlar:
- iOS'ta seslerin çalması için dosyaların app bundle içinde bulunması gerekir. `NotificationSounds` klasörü Xcode projesine eklenmiş olmalıdır.
- Android 8+ için kanallar bir kez oluşturulur; kullanıcı kanal ayarlarından sesi değiştirebilir.

## Kurulum

### 1. Bağımlılıklar

Gerekli paketler zaten yüklenmiştir:
- `@react-native-firebase/app`
- `@react-native-firebase/messaging`
- `expo-notifications`

### 2. Firebase Kurulumu

#### Android
1. Firebase Console'da projenizi oluşturun
2. Android uygulaması ekleyin (package name: `com.yourcompany.kerzzioplus`)
3. `google-services.json` dosyasını `android/app/` klasörüne koyun
4. `android/build.gradle` dosyasına Google Services plugin'ini ekleyin:
   ```gradle
   dependencies {
     classpath 'com.google.gms:google-services:4.3.15'
   }
   ```
5. `android/app/build.gradle` dosyasına plugin'i uygulayın:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

#### iOS
1. Firebase Console'da iOS uygulaması ekleyin (Bundle ID: `com.yourcompany.kerzzioplus`)
2. `GoogleService-Info.plist` dosyasını `ios/kerzzioplus/` klasörüne koyun
3. Xcode'da projeye dosyayı ekleyin
4. APNs sertifikası yükleyin (Firebase Console > Project Settings > Cloud Messaging)

### 3. Expo Konfigürasyonu

`app.json` dosyasına notification ayarlarını ekleyin:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ]
    ],
    "notification": {
      "icon": "./assets/images/notification-icon.png",
      "color": "#ffffff"
    }
  }
}
```

## Kullanım

### 1. Uygulamayı Notification ile Başlatma

```tsx
import { NotificationInitializer } from '@modules/notifications';

export default function App() {
  return (
    <NotificationInitializer>
      {/* Uygulamanızın geri kalanı */}
    </NotificationInitializer>
  );
}
```

### 2. Notification Hook Kullanımı

```tsx
import { useNotifications } from '@modules/notifications';

function MyComponent() {
  const {
    notifications,
    unreadCount,
    hasPermission,
    requestPermission,
    sendNotification,
    markAsRead,
  } = useNotifications();

  const handleSendNotification = async () => {
    await sendNotification(
      'Test Başlığı',
      'Test mesajı içeriği',
      { actionUrl: '/profile' }
    );
  };

  if (!hasPermission) {
    return (
      <button onClick={requestPermission}>
        Notification İzni Ver
      </button>
    );
  }

  return (
    <div>
      <p>Okunmamış: {unreadCount}</p>
      <button onClick={handleSendNotification}>
        Test Notification Gönder
      </button>
    </div>
  );
}
```

### 3. Notification Ayarları

```tsx
import { useNotifications } from '@modules/notifications';

function NotificationSettings() {
  const { settings, updateSettings } = useNotifications();

  const handleToggleCategory = async (category: string) => {
    await updateSettings({
      categories: {
        ...settings?.categories,
        [category]: !settings?.categories[category],
      },
    });
  };

  return (
    <div>
      <h3>Notification Ayarları</h3>
      <label>
        <input
          type="checkbox"
          checked={settings?.categories.messages}
          onChange={() => handleToggleCategory('messages')}
        />
        Mesajlar
      </label>
      {/* Diğer kategoriler */}
    </div>
  );
}
```

### 4. Permission Modal

```tsx
import { NotificationPermissionModal } from '@modules/notifications';

function MyScreen() {
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowPermissionModal(true)}>
        Notification Ayarları
      </button>
      
      <NotificationPermissionModal
        visible={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onPermissionGranted={() => {
          console.log('İzin verildi!');
        }}
      />
    </>
  );
}
```

## API Referansı

### useNotifications Hook

#### State
- `notifications: NotificationData[]` - Tüm notification'lar
- `unreadCount: number` - Okunmamış notification sayısı
- `hasPermission: boolean` - Notification izni var mı
- `isLoading: boolean` - Yükleniyor durumu
- `settings: NotificationSettings` - Kullanıcı ayarları

#### Actions
- `requestPermission()` - Notification izni iste
- `sendNotification(title, body, data?)` - Local notification gönder
- `markAsRead(id)` - Notification'ı okundu olarak işaretle
- `clearAllNotifications()` - Tüm notification'ları temizle
- `updateSettings(settings)` - Ayarları güncelle

### NotificationService

```tsx
import { NotificationService } from '@modules/notifications';

const service = NotificationService.getInstance();

// Token al
const token = await service.getToken();

// Local notification gönder
await service.sendLocalNotification('Başlık', 'İçerik');

// Badge count güncelle
await service.setBadgeCount(5);
```

## Notification Kategorileri

- `messages` - Mesajlar
- `updates` - Güncellemeler
- `promotions` - Promosyonlar
- `reminders` - Hatırlatmalar
- `system` - Sistem bildirimleri

## Deep Linking

Notification'larda `actionUrl` parametresi kullanarak deep linking yapabilirsiniz:

```tsx
await sendNotification(
  'Yeni Mesaj',
  'Bir mesajınız var',
  { 
    actionUrl: '/messages/123',
    category: 'messages'
  }
);
```

## Troubleshooting

### Android
- `google-services.json` dosyasının doğru yerde olduğundan emin olun
- Gradle sync yapın
- Clean build yapın

### iOS
- `GoogleService-Info.plist` dosyasının Xcode projesine eklendiğinden emin olun
- APNs sertifikasının Firebase'de yüklendiğinden emin olun
- Provisioning profile'ın push notification capability'sine sahip olduğundan emin olun

### Genel
- Fiziksel cihazda test edin (simulator'da push notification çalışmaz)
- Network bağlantısını kontrol edin
- Expo Go yerine development build kullanın

## Lisans

MIT
