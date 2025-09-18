# Push Notification Kurulum Rehberi

Bu rehber, Kerzz.io Plus uygulamasında push notification sistemini kurmak için gerekli adımları açıklar.

## 1. Firebase Projesi Oluşturma

### Firebase Console'da Proje Oluşturma
1. [Firebase Console](https://console.firebase.google.com/)'a gidin
2. "Add project" butonuna tıklayın
3. Proje adını girin: `kerzz-io-plus`
4. Google Analytics'i etkinleştirin (opsiyonel)
5. Projeyi oluşturun

## 2. Android Konfigürasyonu

### Firebase'de Android Uygulaması Ekleme
1. Firebase Console'da projenizi açın
2. "Add app" > Android simgesine tıklayın
3. Package name: `com.kerzz.kerzz-io`
4. App nickname: `Kerzz.io Plus Android`
5. SHA-1 sertifikası ekleyin (debug ve release için)

### SHA-1 Sertifikası Alma
```bash
# Debug sertifikası
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Release sertifikası (eğer varsa)
keytool -list -v -keystore /path/to/your/release.keystore -alias your_alias
```

### google-services.json Dosyası
1. Firebase Console'dan `google-services.json` dosyasını indirin
2. Dosyayı `android/app/` klasörüne kopyalayın

### Android Build Konfigürasyonu
1. `android/build.gradle` dosyasını açın:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
        // ... diğer dependencies
    }
}
```

2. `android/app/build.gradle` dosyasını açın:
```gradle
apply plugin: 'com.google.gms.google-services'

android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.kerzz.kerzz-io"
        // ... diğer config
    }
}

dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.2.1'
    // ... diğer dependencies
}
```

## 3. iOS Konfigürasyonu

### Firebase'de iOS Uygulaması Ekleme
1. Firebase Console'da projenizi açın
2. "Add app" > iOS simgesine tıklayın
3. Bundle ID: `com.kerzz.kerzz-ios`
4. App nickname: `Kerzz.io Plus iOS`

### GoogleService-Info.plist Dosyası
1. Firebase Console'dan `GoogleService-Info.plist` dosyasını indirin
2. Dosyayı `ios/kerzzioplus/` klasörüne kopyalayın
3. Xcode'da projeyi açın ve dosyayı projeye ekleyin

### APNs Sertifikası Yükleme
1. Apple Developer Console'da APNs sertifikası oluşturun
2. Firebase Console > Project Settings > Cloud Messaging'e gidin
3. iOS app configuration bölümünde sertifikayı yükleyin

### iOS Capabilities Ekleme
Xcode'da:
1. Target'ı seçin
2. "Signing & Capabilities" sekmesine gidin
3. "+ Capability" butonuna tıklayın
4. "Push Notifications" ekleyin
5. "Background Modes" ekleyin ve "Background processing" ile "Remote notifications" seçin

## 4. Expo Konfigürasyonu

`app.json` dosyası zaten güncellenmiştir. Aşağıdaki konfigürasyonlar eklenmiştir:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/icon.png",
          "color": "#3B82F6",
          "defaultChannel": "default",
          "sounds": []
        }
      ]
    ],
    "notification": {
      "icon": "./assets/images/icon.png",
      "color": "#3B82F6"
    }
  }
}
```

## 5. Environment Variables

`.env` dosyası oluşturun (eğer yoksa):
```env
EXPO_PUBLIC_PROJECT_ID=your-firebase-project-id
EXPO_PUBLIC_FCM_SENDER_ID=your-sender-id
```

Firebase Project ID'yi Firebase Console > Project Settings'den alabilirsiniz.

## 6. Development Build Oluşturma

Push notification'lar Expo Go'da çalışmaz. Development build oluşturmanız gerekir:

```bash
# EAS CLI yükleyin (eğer yoksa)
npm install -g @expo/eas-cli

# EAS'a giriş yapın
eas login

# Build konfigürasyonu oluşturun
eas build:configure

# Development build oluşturun
eas build --profile development --platform all
```

## 7. Test Etme

### Local Notification Testi
```tsx
import { useNotifications } from '@modules/notifications';

function TestComponent() {
  const { sendNotification } = useNotifications();
  
  const testNotification = async () => {
    await sendNotification(
      'Test Başlığı',
      'Bu bir test mesajıdır',
      { actionUrl: '/profile' }
    );
  };
  
  return (
    <button onClick={testNotification}>
      Test Notification Gönder
    </button>
  );
}
```

### Push Notification Testi
Firebase Console > Cloud Messaging > "Send your first message" ile test mesajı gönderin.

## 8. Sunucu Entegrasyonu

### API Endpoint'leri
Aşağıdaki endpoint'leri sunucunuzda oluşturun:

```
POST /api/notifications/register-token
PUT /api/notifications/update-token
DELETE /api/notifications/delete-token
GET /api/notifications/user-tokens
POST /api/notifications/validate-token
```

### Token Kaydetme Örneği
```javascript
// Node.js/Express örneği
app.post('/api/notifications/register-token', async (req, res) => {
  const { token, userId, platform, deviceId } = req.body;
  
  try {
    // Token'ı veritabanına kaydet
    await db.collection('fcm_tokens').add({
      token,
      userId,
      platform,
      deviceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## 9. Troubleshooting

### Yaygın Sorunlar

#### Android
- `google-services.json` dosyasının doğru yerde olduğundan emin olun
- Package name'in Firebase'deki ile aynı olduğunu kontrol edin
- Gradle sync yapın: `cd android && ./gradlew clean`

#### iOS
- Bundle ID'nin Firebase'deki ile aynı olduğunu kontrol edin
- APNs sertifikasının yüklendiğinden emin olun
- Xcode'da "Clean Build Folder" yapın

#### Genel
- Fiziksel cihazda test edin (simulator'da push notification çalışmaz)
- Network bağlantısını kontrol edin
- Console log'larını kontrol edin

### Debug Komutları
```bash
# Android log'ları
adb logcat | grep -i firebase

# iOS log'ları (Xcode Console)
# Xcode > Window > Devices and Simulators > View Device Logs

# Expo log'ları
npx expo start --dev-client
```

## 10. Production Deployment

### Android
1. Release keystore oluşturun
2. SHA-1 sertifikasını Firebase'e ekleyin
3. Production build oluşturun: `eas build --profile production --platform android`

### iOS
1. Distribution sertifikası oluşturun
2. Production APNs sertifikası yükleyin
3. Production build oluşturun: `eas build --profile production --platform ios`

## 11. Güvenlik Notları

- FCM Server Key'i güvenli bir yerde saklayın
- Token'ları HTTPS üzerinden gönderin
- Kullanıcı izinlerini kontrol edin
- Rate limiting uygulayın
- Token'ları düzenli olarak temizleyin

## 12. Monitoring ve Analytics

Firebase Console'da:
- Cloud Messaging > Analytics
- Crashlytics (hata takibi için)
- Performance Monitoring

Bu rehberi takip ederek push notification sisteminizi başarıyla kurabilirsiniz.
