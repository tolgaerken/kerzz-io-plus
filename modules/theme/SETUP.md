# Theme Module Kurulum Rehberi

## 1. Modül Kurulumu

### Gerekli Bağımlılıklar

Tema modülü aşağıdaki bağımlılıkları kullanır:

```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0"
}
```

### Kurulum Adımları

1. **Modül Import Edilmesi**
```tsx
import { ThemeProvider } from '@modules/theme';
```

2. **Ana Uygulama Sarmalama**
```tsx
// App.tsx
import React from 'react';
import { ThemeProvider } from '@modules/theme';
import { YourMainComponent } from './components';

function App() {
  return (
    <ThemeProvider>
      <YourMainComponent />
    </ThemeProvider>
  );
}

export default App;
```

## 2. TypeScript Konfigürasyonu

`tsconfig.json` dosyanıza path mapping ekleyin:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@modules/*": ["src/modules/*"],
      "@modules/theme": ["src/modules/theme"]
    }
  }
}
```

## 3. Tailwind CSS Entegrasyonu (Opsiyonel)

Eğer Tailwind CSS kullanıyorsanız, tema sistemini entegre edebilirsiniz:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Tema renklerini Tailwind ile senkronize et
      }
    }
  }
}
```

## 4. İlk Kullanım

### Basit Kullanım

```tsx
import React from 'react';
import { useTheme, useStyles } from '@modules/theme';

export function ExampleComponent() {
  const { theme, mode, setMode } = useTheme();
  const styles = useStyles();

  return (
    <div className={styles.container()}>
      <h1 className={styles.header({ size: 'large' })}>
        Hoş Geldiniz
      </h1>

      <button
        className={styles.button({ variant: 'primary' })}
        onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
      >
        Tema Değiştir ({mode})
      </button>

      <p style={{ color: theme.colors.text.primary }}>
        Mevcut tema: {theme.name}
      </p>
    </div>
  );
}
```

### Responsive Kullanım

```tsx
import React from 'react';
import { useResponsive } from '@modules/theme';

export function ResponsiveComponent() {
  const { isMobile, isTablet, isDesktop, deviceType } = useResponsive();

  return (
    <div>
      <p>Cihaz Tipi: {deviceType}</p>
      {isMobile && <MobileView />}
      {isTablet && <TabletView />}
      {isDesktop && <DesktopView />}
    </div>
  );
}
```

## 5. Konfigürasyon

### Varsayılan Tema Ayarlama

```tsx
import { ThemeProvider } from '@modules/theme';

function App() {
  return (
    <ThemeProvider
      defaultTheme="colorful"
      defaultMode="dark"
      // Diğer konfigürasyon seçenekleri
    >
      <YourApp />
    </ThemeProvider>
  );
}
```

### LocalStorage Entegrasyonu

Tema modülü otomatik olarak kullanıcı tercihlerini localStorage'a kaydeder.

## 6. Performans İpuçları

- Tema değişiklikleri optimize edilmiştir
- Sadece gerekli bileşenler yeniden render edilir
- Responsive hesaplamalar cache'lenir

## 7. Sorun Giderme

### Sık Karşılaşılan Sorunlar

1. **Tema renkleri görünmüyor**
   - ThemeProvider'ın uygulamanızı sardığından emin olun
   - CSS'in doğru yüklendiğini kontrol edin

2. **TypeScript hataları**
   - Path mapping'lerin doğru yapılandırıldığından emin olun
   - Tip tanımlarını import ettiğinizden emin olun

3. **Responsive davranış çalışmıyor**
   - Window resize event'lerinin doğru dinlendiğinden emin olun
   - Breakpoint değerlerini kontrol edin

## 8. İleri Seviye Kullanım

### Özel Tema Oluşturma

```tsx
import { ThemeConfig } from '@modules/theme';

const customTheme: ThemeConfig = {
  name: 'myCustomTheme',
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      // ... diğer tonlar
    }
  }
};

// Tema'yı kaydet ve kullan
```

Bu kurulum rehberi ile tema modülünü başarılı bir şekilde projenize entegre edebilirsiniz.