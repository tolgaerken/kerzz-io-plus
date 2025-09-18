# Theme Module

Bu modül, Orwi rezervasyon uygulaması için kapsamlı bir tema sistemi sağlar. Farklı projelerde yeniden kullanılabilir olacak şekilde tasarlanmıştır.

## Özellikler

- 🎨 Multiple tema desteği (light, dark, colorful)
- 📱 Responsive tasarım desteği
- 🎯 TypeScript desteği
- 🔧 Kolay özelleştirme
- 🚀 Performans odaklı
- 📦 Modüler yapı

## Kurulum

```bash
# Projenize modülü dahil edin
import { ThemeProvider, useTheme, useStyles } from '@modules/theme';
```

## Kullanım

### 1. ThemeProvider ile Sarmalama

```tsx
import { ThemeProvider } from '@modules/theme';

function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}
```

### 2. Tema Kullanımı

```tsx
import { useTheme } from '@modules/theme';

function Component() {
  const { theme, mode, setTheme, setMode } = useTheme();

  return (
    <div style={{ backgroundColor: theme.colors.background.primary }}>
      <h1>Mevcut tema: {theme.name}</h1>
    </div>
  );
}
```

### 3. Stil Sistemi

```tsx
import { useStyles } from '@modules/theme';

function Component() {
  const styles = useStyles();

  return (
    <button className={styles.button()}>
      Buton
    </button>
  );
}
```

## API Referansı

### Hooks

- `useTheme()` - Tema durumu ve kontrol fonksiyonları
- `useStyles()` - Stil sistemi
- `useResponsive()` - Responsive yardımcıları
- `useBreakpoint()` - Breakpoint bilgisi

### Types

- `ThemeType` - Tema tipi
- `ThemeName` - Tema adları
- `ThemeMode` - Tema modu (light/dark)
- `ColorPalette` - Renk paleti
- `DeviceType` - Cihaz tipi

### Constants

- `DEFAULT_THEME` - Varsayılan tema
- `DEFAULT_MODE` - Varsayılan mod
- `themeColors` - Tema renkleri
- `BREAKPOINTS` - Breakpoint değerleri

## Özelleştirme

Modül tamamen özelleştirilebilir. Kendi tema renklerinizi ve stillerinizi tanımlayabilirsiniz.

## Lisans

MIT License