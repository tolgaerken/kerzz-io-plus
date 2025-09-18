# React Native Theme Sistemi

Bu dokümantasyon, theme modülünün React Native'e nasıl adapte edildiğini ve nasıl kullanılacağını açıklar.

## 🎯 Özellikler

- ✅ **4 Farklı Tema**: Classic, Modern, Futuristic, Retro
- ✅ **Light/Dark Mode**: Otomatik sistem tema desteği
- ✅ **Responsive Design**: Phone, Tablet, Web desteği
- ✅ **AsyncStorage**: Tema tercihlerini kalıcı saklama
- ✅ **StyleSheet**: React Native performans optimizasyonu
- ✅ **TypeScript**: Tam tip güvenliği
- ✅ **Appearance API**: Sistem tema değişikliklerini dinleme

## 📦 Kurulum

### 1. Bağımlılıklar

```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^2.1.0",
    "react-native": "0.81.4"
  }
}
```

### 2. TypeScript Konfigürasyonu

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@modules/*": ["./modules/*"]
    }
  }
}
```

## 🚀 Hızlı Başlangıç

### 1. ThemeProvider ile Sarmalama

```tsx
// App.tsx
import React from 'react';
import { ThemeProvider } from '@modules/theme';
import { MainApp } from './MainApp';

export default function App() {
  return (
    <ThemeProvider defaultTheme="classic" defaultMode="light">
      <MainApp />
    </ThemeProvider>
  );
}
```

### 2. Temel Kullanım

```tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme, useStyles } from '@modules/theme';

export function MyComponent() {
  const { theme, toggleMode } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.common.container}>
      <Text style={{
        color: theme.colors.text,
        fontSize: theme.fontSize.large
      }}>
        Merhaba Dünya!
      </Text>
      
      <Pressable
        style={styles.button.primary}
        onPress={toggleMode}
      >
        <Text style={{ color: theme.colors.primaryLight }}>
          Tema Değiştir
        </Text>
      </Pressable>
    </View>
  );
}
```

## 📱 Responsive Kullanım

### Cihaz Tespiti

```tsx
import { useResponsive } from '@modules/theme';

export function ResponsiveComponent() {
  const { deviceInfo, styleByDevice } = useResponsive();

  const containerPadding = styleByDevice({
    phone: 16,
    tablet: 24,
    web: 32,
    default: 16
  });

  return (
    <View style={{ padding: containerPadding }}>
      {deviceInfo.isPhone && <PhoneLayout />}
      {deviceInfo.isTablet && <TabletLayout />}
      {deviceInfo.isWeb && <WebLayout />}
    </View>
  );
}
```

### Breakpoint Kontrolü

```tsx
import { useBreakpoint } from '@modules/theme';

export function BreakpointExample() {
  const { isMobile, isTabletUp, isAbove } = useBreakpoint();

  return (
    <View>
      {isMobile && <Text>Mobil görünüm</Text>}
      {isTabletUp && <Text>Tablet ve üzeri</Text>}
      {isAbove('largeTablet') && <Text>Büyük tablet ve üzeri</Text>}
    </View>
  );
}
```

## 🎨 Tema Yönetimi

### Tema Değiştirme

```tsx
import { useTheme } from '@modules/theme';

export function ThemeSelector() {
  const { themeName, themeMode, setTheme, setMode, toggleMode } = useTheme();

  return (
    <View>
      {/* Tema Seçimi */}
      <Pressable onPress={() => setTheme('classic')}>
        <Text>Classic Tema</Text>
      </Pressable>
      
      <Pressable onPress={() => setTheme('modern')}>
        <Text>Modern Tema</Text>
      </Pressable>

      {/* Mode Değiştirme */}
      <Pressable onPress={toggleMode}>
        <Text>{themeMode === 'light' ? 'Dark' : 'Light'} Mode</Text>
      </Pressable>
    </View>
  );
}
```

### Tema Bilgilerine Erişim

```tsx
export function ThemeInfo() {
  const { theme, themeName, themeMode, isDarkMode } = useTheme();

  return (
    <View>
      <Text>Tema: {themeName}</Text>
      <Text>Mod: {themeMode}</Text>
      <Text>Dark Mode: {isDarkMode ? 'Evet' : 'Hayır'}</Text>
      <Text>Primary Renk: {theme.colors.primary}</Text>
    </View>
  );
}
```

## 🎭 Stil Sistemi

### Hazır Stiller

```tsx
import { useStyles } from '@modules/theme';

export function StyleExample() {
  const styles = useStyles();

  return (
    <View style={styles.common.container}>
      {/* Buton Stilleri */}
      <Pressable style={styles.button.primary}>
        <Text>Primary Button</Text>
      </Pressable>
      
      <Pressable style={styles.button.outline}>
        <Text>Outline Button</Text>
      </Pressable>

      {/* Kart Stilleri */}
      <View style={styles.card.default}>
        <Text>Default Card</Text>
      </View>
      
      <View style={styles.card.elevated}>
        <Text>Elevated Card</Text>
      </View>
    </View>
  );
}
```

### Custom Stiller

```tsx
import { StyleSheet } from 'react-native';
import { useTheme } from '@modules/theme';

export function CustomStyleExample() {
  const { theme } = useTheme();

  const customStyles = StyleSheet.create({
    customContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.spacing.small,
      padding: theme.spacing.medium,
      marginVertical: theme.spacing.small,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    customText: {
      color: theme.colors.text,
      fontSize: theme.fontSize.large,
      fontWeight: 'bold',
    }
  });

  return (
    <View style={customStyles.customContainer}>
      <Text style={customStyles.customText}>
        Custom Styled Component
      </Text>
    </View>
  );
}
```

## 🔧 İleri Seviye Kullanım

### Tema Değişikliklerini Dinleme

```tsx
import { useEffect } from 'react';
import { useTheme } from '@modules/theme';

export function ThemeListener() {
  const { theme, themeName, themeMode } = useTheme();

  useEffect(() => {
    console.log('Tema değişti:', { themeName, themeMode });
    // Tema değişikliği sonrası işlemler
  }, [themeName, themeMode]);

  return null;
}
```

### Conditional Styling

```tsx
export function ConditionalStyling() {
  const { theme, isDarkMode } = useTheme();
  const styles = useStyles();

  return (
    <View style={[
      styles.common.container,
      isDarkMode && { backgroundColor: '#000' }
    ]}>
      <Text style={{
        color: theme.colors.text,
        opacity: isDarkMode ? 0.8 : 1
      }}>
        Conditional Styled Text
      </Text>
    </View>
  );
}
```

## 📊 Tema Renkleri

### Mevcut Temalar

#### Classic Tema
- **Primary**: #3E4E5E (Koyu mavi gri)
- **Secondary**: #B78846 (Altın sarısı)
- **Background**: #FAF7F2 (Krem)

#### Modern Tema
- **Primary**: #6C63FF (Modern mor)
- **Secondary**: #00BFA6 (Teal)
- **Background**: #F8F9FD (Açık mavi)

#### Futuristic Tema
- **Primary**: #0ABDE3 (Siber mavi)
- **Secondary**: #5F27CD (Mor)
- **Background**: #171B26 (Koyu)

#### Retro Tema
- **Primary**: #FF6B6B (Retro kırmızı)
- **Secondary**: #4ECDC4 (Turkuaz)
- **Background**: #FFF8E6 (Krem)

### Renk Paletine Erişim

```tsx
export function ColorPalette() {
  const { theme } = useTheme();
  
  return (
    <View>
      {/* Ana Renkler */}
      <View style={{ backgroundColor: theme.colors.primary }} />
      <View style={{ backgroundColor: theme.colors.secondary }} />
      
      {/* Durum Renkleri */}
      <View style={{ backgroundColor: theme.colors.success }} />
      <View style={{ backgroundColor: theme.colors.error }} />
      <View style={{ backgroundColor: theme.colors.warning }} />
      
      {/* Metin Renkleri */}
      <Text style={{ color: theme.colors.text }}>Ana Metin</Text>
      <Text style={{ color: theme.colors.textLight }}>Açık Metin</Text>
    </View>
  );
}
```

## 📏 Font ve Spacing

### Font Boyutları

```tsx
export function FontSizes() {
  const { theme } = useTheme();
  
  return (
    <View>
      <Text style={{ fontSize: theme.fontSize.tiny }}>Tiny (10px)</Text>
      <Text style={{ fontSize: theme.fontSize.small }}>Small (12px)</Text>
      <Text style={{ fontSize: theme.fontSize.medium }}>Medium (14px)</Text>
      <Text style={{ fontSize: theme.fontSize.regular }}>Regular (16px)</Text>
      <Text style={{ fontSize: theme.fontSize.large }}>Large (18px)</Text>
      <Text style={{ fontSize: theme.fontSize.xlarge }}>XLarge (20px)</Text>
    </View>
  );
}
```

### Spacing Değerleri

```tsx
export function SpacingExample() {
  const { theme } = useTheme();
  
  return (
    <View>
      <View style={{ padding: theme.spacing.tiny }}>Tiny Padding</View>
      <View style={{ padding: theme.spacing.small }}>Small Padding</View>
      <View style={{ padding: theme.spacing.medium }}>Medium Padding</View>
      <View style={{ padding: theme.spacing.regular }}>Regular Padding</View>
      <View style={{ padding: theme.spacing.large }}>Large Padding</View>
    </View>
  );
}
```

## 🔄 Migration Guide

### Web'den React Native'e Geçiş

#### Değişiklikler:
1. **Storage**: `localStorage` → `AsyncStorage`
2. **Styling**: CSS → StyleSheet
3. **Events**: `window.matchMedia` → `Appearance.addChangeListener`
4. **Dimensions**: `window.innerWidth` → `Dimensions.get('window')`

#### Eski Kod:
```tsx
// Web
const styles = {
  container: {
    backgroundColor: theme.colors.background,
    ':hover': {
      backgroundColor: theme.colors.cardAlt
    }
  }
};
```

#### Yeni Kod:
```tsx
// React Native
const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    // Hover effects Pressable ile
  }
});
```

## 🐛 Sorun Giderme

### Sık Karşılaşılan Sorunlar

#### 1. AsyncStorage Hatası
```
Error: AsyncStorage is not available
```
**Çözüm**: `@react-native-async-storage/async-storage` paketini yükleyin.

#### 2. Theme Yüklenmiyor
```
Theme preferences not loading
```
**Çözüm**: ThemeProvider'ın uygulamanızı sardığından emin olun.

#### 3. StyleSheet Hatası
```
Invalid style property
```
**Çözüm**: Web-specific CSS özelliklerini kaldırın (hover, transition, vb.)

### Debug Logging

```tsx
import { useTheme } from '@modules/theme';

export function DebugTheme() {
  const { theme, themeName, themeMode } = useTheme();
  
  console.log('Current Theme:', {
    name: themeName,
    mode: themeMode,
    colors: theme.colors,
    fontSize: theme.fontSize,
    spacing: theme.spacing
  });
  
  return null;
}
```

## 📈 Performans İpuçları

1. **StyleSheet Kullanın**: CSS objesi yerine StyleSheet.create()
2. **Memoization**: useMemo ile stil hesaplamalarını cache'leyin
3. **Conditional Rendering**: Gereksiz re-render'ları önleyin
4. **Theme Değişikliklerini Optimize Edin**: Sadece gerekli bileşenler güncellensin

## 🎉 Sonuç

React Native theme sistemi artık tamamen hazır! Bu sistem ile:

- **4 farklı tema** arasında geçiş yapabilirsiniz
- **Responsive design** desteği alırsınız  
- **Performanslı styling** sistemi kullanırsınız
- **Type-safe** tema yönetimi yaparsınız
- **Persistent** tema tercihleri saklarsınız

Herhangi bir sorunla karşılaştığınızda bu dokümantasyonu referans alabilirsiniz.
