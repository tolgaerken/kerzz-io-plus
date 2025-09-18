# Auth Module

Bu modül, KERZZ rezervasyon sisteminin tüm kimlik doğrulama işlemlerini yönetir. Modül, React projelerinde kolayca kullanılabilir ve başka projelere aktarılabilir şekilde tasarlanmıştır.

## 📁 Klasör Yapısı

```
src/modules/auth/
├── components/          # Auth ile ilgili React bileşenleri
│   ├── ProtectedRoute.tsx
│   ├── AuthInitializer.tsx
│   └── index.ts
├── constants/           # API endpoints, yapılandırma sabitleri
│   └── index.ts
├── hooks/              # Custom React hooks
│   └── useResponsive.ts
├── pages/              # Login ve setup sayfaları
│   ├── LoginPage.tsx
│   ├── SetupWizard.tsx
│   └── index.ts
├── services/           # API servisleri
│   ├── kerzz-sso.ts
│   ├── httpClient.ts
│   └── index.ts
├── stores/             # Zustand state management
│   └── authStore.ts
├── types/              # TypeScript tip tanımları
│   ├── auth.ts
│   ├── kerzz.ts
│   └── index.ts
├── utils/              # Yardımcı fonksiyonlar
│   ├── authHelpers.ts
│   └── index.ts
├── index.ts            # Ana export dosyası
└── README.md           # Bu döküman
```

## 🚀 Hızlı Başlangıç

### 1. Modülü Projenize Kopyalayın

```bash
# Auth modülünü yeni projenizin src/modules/ klasörüne kopyalayın
cp -r src/modules/auth /path/to/new/project/src/modules/
```

### 2. Gerekli Bağımlılıkları Yükleyin

```bash
npm install zustand react-router-dom react-hot-toast lucide-react axios jwt-decode
```

### 3. Environment Variables Ayarlayın

`.env` dosyanızda:

```env
VITE_KERZZ_API_KEY=your-kerzz-api-key
VITE_KERZZ_USER_TOKEN=your-user-token
VITE_API_TIMEOUT=10000
VITE_API_TIMEOUT_LONG=120000
```

### 4. Ana Uygulama Dosyanızda Kullanın

```tsx
// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import {
  LoginPage,
  SetupWizard,
  useAuthStore,
  ProtectedRoute,
  AuthInitializer
} from './modules/auth';

function App() {
  return (
    <Router>
      <AuthInitializer>
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

          {/* First Login Setup */}
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
            path="/*"
            element={
              <ProtectedRoute requireAuth={true}>
                {/* Your protected app content */}
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthInitializer>
    </Router>
  );
}

export default App;
```

## 📋 API Referansı

### Auth Store (useAuthStore)

```tsx
import { useAuthStore } from './modules/auth';

const MyComponent = () => {
  const {
    // State
    user,
    isAuthenticated,
    isFirstLogin,
    isInitializing,
    isSendingOTP,
    isVerifyingOTP,
    error,
    otpError,

    // Actions
    sendOTP,
    verifyOTP,
    logout,
    clearErrors,
    initializeAuth
  } = useAuthStore();

  // Component logic
};
```

#### State Properties

- `user`: Kullanıcı bilgileri (User | null)
- `isAuthenticated`: Kimlik doğrulama durumu (boolean)
- `isFirstLogin`: İlk giriş kontrolü (boolean)
- `restaurant`: Restoran bilgileri (Restaurant | undefined)
- `userInfo`: KERZZ SSO kullanıcı bilgileri (TUserInfo | undefined)
- `selectedLicense`: Seçili lisans bilgileri (any)
- `isLoading`: Genel yükleme durumu (boolean)
- `isInitializing`: Başlatma durumu (boolean)
- `isSendingOTP`: OTP gönderme durumu (boolean)
- `isVerifyingOTP`: OTP doğrulama durumu (boolean)
- `isLoggingIn`: Giriş yapma durumu (boolean)
- `error`: Genel hata mesajı (string | null)
- `otpError`: OTP hata mesajı (string | null)
- `loginError`: Giriş hata mesajı (string | null)
- `step`: OTP akış adımı ('phone' | 'otp' | 'completed')

#### Actions

- `sendOTP(phoneNumber: string)`: OTP kodu gönder
- `verifyOTP(code: string)`: OTP kodunu doğrula
- `login(credentials: LoginCredentials)`: Giriş yap
- `logout()`: Çıkış yap
- `clearErrors()`: Hataları temizle
- `resetOTPFlow()`: OTP akışını sıfırla
- `initializeAuth()`: Auth sistemini başlat
- `setSelectedLicense(license: any)`: Lisans seç

### Services

#### KERZZ SSO Service

```tsx
import {
  requestOtpSms,
  verifyOtpSms,
  autoLogin,
  logout,
  getStoredToken
} from './modules/auth';

// OTP gönder
const result = await requestOtpSms('+905551234567');

// OTP doğrula
const loginResult = await verifyOtpSms('+905551234567', '123456');

// Otomatik giriş
const autoLoginResult = await autoLogin();
```

#### HTTP Client Service

```tsx
import { httpClient } from './modules/auth';

// GET isteği
const data = await httpClient.get('/api/data');

// POST isteği
const result = await httpClient.post('/api/data', {
  key: 'value'
});
```

### Components

#### ProtectedRoute

```tsx
import { ProtectedRoute } from './modules/auth';

// Kimlik doğrulama gerektiren rota
<ProtectedRoute requireAuth={true}>
  <ProtectedContent />
</ProtectedRoute>

// Public rota (giriş yapmış kullanıcıları redirect et)
<ProtectedRoute requireAuth={false} redirectTo="/dashboard">
  <LoginForm />
</ProtectedRoute>

// İlk giriş gerektiren rota
<ProtectedRoute requireAuth={true} requireFirstLogin={true}>
  <SetupWizard />
</ProtectedRoute>
```

#### AuthInitializer

```tsx
import { AuthInitializer } from './modules/auth';

<AuthInitializer onInitialized={() => console.log('Auth ready')}>
  <App />
</AuthInitializer>
```

### Utilities

#### Auth Helpers

```tsx
import {
  formatPhoneNumber,
  validatePhoneNumber,
  validateOTP,
  hasPermission,
  hasRole,
  getPrimaryLicense
} from './modules/auth';

// Telefon numarası formatla
const formatted = formatPhoneNumber('5551234567'); // +905551234567

// İzin kontrolü
const canEdit = hasPermission(userInfo, 'edit-customers');

// Rol kontrolü
const isAdmin = hasRole(userInfo, 'admin');
```

### Hooks

#### useResponsive

```tsx
import { useResponsive } from './modules/auth';

const MyComponent = () => {
  const { deviceInfo, styleByDevice } = useResponsive();

  return (
    <div className={styleByDevice({
      default: "text-base p-4",
      phone: "text-sm p-2",
      tablet: "text-base p-3"
    })}>
      Content
    </div>
  );
};
```

## 🔧 Özelleştirme

### 1. Custom Loading Component

```tsx
const CustomLoader = () => (
  <div className="custom-loading">
    <div className="spinner" />
    <p>Yükleniyor...</p>
  </div>
);

<AuthInitializer loadingComponent={CustomLoader}>
  <App />
</AuthInitializer>
```

### 2. Custom Error Handling

```tsx
const { error, clearErrors } = useAuthStore();

useEffect(() => {
  if (error) {
    // Custom error handling
    toast.error(error);
    clearErrors();
  }
}, [error, clearErrors]);
```

### 3. Environment Configuration

```tsx
// constants/index.ts dosyasında ayarları değiştirin
export const KERZZ_SSO = {
  BASE_URL: 'https://your-sso-service.com',
  API_KEY: import.meta.env.VITE_YOUR_API_KEY,
  // ...
} as const
```

## 🔒 Güvenlik

### Token Management

- Access token'lar otomatik olarak yönetilir
- Session/localStorage arasında akıllı depolama
- Token yenileme işlemi otomatik
- Güvenli logout işlemi

### API Security

- Tüm API çağrıları token ile korunur
- Request interceptor ile otomatik header ekleme
- CORS ve güvenlik header'ları

## 📱 Responsive Support

Auth modülü tam responsive desteği sunar:

- Mobile-first design
- Tablet ve desktop optimizasyonları
- Responsive utility hooks
- Device detection

## 🐛 Debugging

### Debug Logging

Auth modülü kapsamlı debug logging sunar:

```tsx
// Console'da şu mesajları görebilirsiniz:
// 🔧 Kerzz SSO autoLogin fonksiyonu çağrıldı
// 📱 OTP gönderimi başlatılıyor
// ✅ OTP başarıyla gönderildi
// ❌ OTP gönderimi başarısız
```

### Common Issues

1. **Token bulunamadı**: Environment variables kontrolü
2. **CORS hatası**: Backend CORS ayarlarını kontrol edin
3. **OTP gönderilmiyor**: API key ve endpoint kontrolü
4. **Sonsuz loading**: Network tab'ı kontrol edin

## 🔄 Migration Guide

Mevcut projeden auth modülünü kullanmaya geçiş:

### 1. Import Paths Update

```tsx
// Eski
import { useAuthStore } from '../stores/authStore';

// Yeni
import { useAuthStore } from './modules/auth';
```

### 2. Component Updates

```tsx
// Eski route yapısı
<Route path="/login" element={<LoginPage />} />

// Yeni route yapısı
<Route path="/login" element={
  <ProtectedRoute requireAuth={false}>
    <LoginPage />
  </ProtectedRoute>
} />
```

## 📦 Dependencies

Modülün gerektirdiği NPM paketleri:

```json
{
  "dependencies": {
    "zustand": "^4.x",
    "react-router-dom": "^6.x",
    "react-hot-toast": "^2.x",
    "lucide-react": "^0.x",
    "axios": "^1.x",
    "jwt-decode": "^4.x"
  }
}
```

## 🤝 Contributing

Auth modülünü geliştirmek için:

1. Feature branch oluşturun
2. TypeScript tiplerini güncel tutun
3. Test coverage'ı koruyun
4. Documentation'ı güncelleyin

## 📄 License

Bu modül MIT lisansı altında lisanslanmıştır.