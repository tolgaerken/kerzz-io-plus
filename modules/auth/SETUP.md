# Auth Module - Hızlı Kurulum Rehberi

Bu rehber, auth modülünü yeni bir projeye nasıl kuracağınızı adım adım anlatır.

## 🚀 5 Dakikada Kurulum

### Adım 1: Modülü Kopyalayın

```bash
# Bu auth klasörünü yeni projenizin src/modules/ altına kopyalayın
cp -r src/modules/auth /path/to/new/project/src/modules/
```

### Adım 2: Gerekli Paketleri Yükleyin

```bash
npm install zustand react-router-dom react-hot-toast lucide-react axios jwt-decode
```

### Adım 3: Environment Variables

`.env` dosyası oluşturun:

```env
VITE_KERZZ_API_KEY=your-api-key-here
VITE_KERZZ_USER_TOKEN=your-user-token-here
VITE_API_TIMEOUT=10000
VITE_API_TIMEOUT_LONG=120000
```

### Adım 4: App.tsx Güncelleyin

```tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import {
  LoginPage,
  SetupWizard,
  useAuthStore,
  ProtectedRoute,
  AuthInitializer
} from './modules/auth';

// Diğer sayfalarınız
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

function AppContent() {
  const { isAuthenticated, isFirstLogin } = useAuthStore();

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <ProtectedRoute requireAuth={false} redirectTo="/">
              <LoginPage />
            </ProtectedRoute>
          }
        />

        {/* Setup Route */}
        <Route
          path="/setup"
          element={
            <ProtectedRoute requireAuth={true} requireFirstLogin={true}>
              <SetupWizard />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute requireAuth={true}>
              {isFirstLogin ? <Navigate to="/setup" /> : <Dashboard />}
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute requireAuth={true}>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthInitializer>
        <AppContent />
      </AuthInitializer>
    </Router>
  );
}

export default App;
```

### Adım 5: Test Edin

```bash
npm start
```

Tarayıcıda `http://localhost:3000/login` adresine gidin. Login sayfası görüntülenmelidir.

## ✅ Kontrol Listesi

- [ ] Modül kopyalandı
- [ ] NPM paketleri yüklendi
- [ ] Environment variables ayarlandı
- [ ] App.tsx güncellendi
- [ ] Login sayfası çalışıyor
- [ ] OTP gönderimi test edildi
- [ ] Protected routes çalışıyor

## 🔧 Özelleştirme

### Login Sayfasını Özelleştirin

```tsx
// modules/auth/pages/LoginPage.tsx dosyasında:
// - Renkleri değiştirin
// - Logo/branding ekleyin
// - CSS class'larını güncelleyin
```

### API Endpoint'lerini Değiştirin

```tsx
// modules/auth/constants/index.ts dosyasında:
export const KERZZ_SSO = {
  BASE_URL: 'https://your-api-endpoint.com',
  // ...
}
```

### Yönlendirme Kurallarını Ayarlayın

```tsx
// App.tsx'de istediğiniz route yapısını oluşturun
<Route path="/dashboard" element={
  <ProtectedRoute requireAuth={true}>
    <Dashboard />
  </ProtectedRoute>
} />
```

## 🆘 Sorun Giderme

### 1. "Module not found" Hatası

```bash
# Path'leri kontrol edin
ls src/modules/auth
```

### 2. Environment Variables Çalışmıyor

```bash
# .env dosyasının root dizinde olduğunu kontrol edin
# Değişken isimlerinin VITE_ ile başladığını kontrol edin
```

### 3. CORS Hatası

API sunucunuzun CORS ayarlarını kontrol edin.

### 4. Token Bulunamadı

Environment variables'ları kontrol edin:
- VITE_KERZZ_API_KEY
- VITE_KERZZ_USER_TOKEN

## 📞 Destek

Sorun yaşarsanız:
1. Console log'larını kontrol edin
2. Network tab'ını kontrol edin
3. Environment variables'ları doğrulayın
4. API endpoint'lerinin erişilebilir olduğunu kontrol edin

## 🎉 Tamamlandı!

Auth modülünüz artık hazır. Kullanıcılarınız:
- Telefon numarası ile OTP alabilir
- OTP ile giriş yapabilir
- Otomatik login özelliğini kullanabilir
- Güvenli şekilde çıkış yapabilir

Projenizin geri kalanını geliştirmeye devam edebilirsiniz!