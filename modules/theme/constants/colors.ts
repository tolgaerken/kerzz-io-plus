import { ColorPalette, ThemeName, ThemeMode } from '../types';

// 1. Classic (Varsayılan) Tema
export const classicColors: ColorPalette = {
  primary: '#3E4E5E',        // Ana renk - koyu mavi gri
  primaryLight: 'white',     // Açık varyant
  primaryDark: '#2B3643',    // Koyu varyant
  secondary: '#B78846',      // İkincil renk - altın sarısı
  background: '#FAF7F2',     // Arka plan - krem
  card: '#FFFFFF',           // Kart arka planı
  cardAlt: '#F2EDE4',        // Alternatif kart
  text: '#2C2C2C',           // Ana metin
  textLight: '#6B6B6B',      // Açık metin
  border: '#D8D1C7',         // Kenarlık
  success: '#5A9E55',        // Başarı - yeşil
  error: '#C45B5B',          // Hata - kırmızı
  warning: '#D18F52',        // Uyarı - turuncu
  info: '#5782AB',           // Bilgi - mavi
  input: '#FAF7F2'           // Giriş alanları
};

// Classic Dark Theme
export const darkClassicColors: ColorPalette = {
  primary: '#3E4E5E',        // Ana renk aynı kalır
  primaryLight: '#FAF7F2',   // Light tema background'u primary light olarak
  primaryDark: '#2B3643',    // Koyu varyant aynı
  secondary: '#B78846',      // İkincil renk aynı - altın sarısı
  background: '#1C1C1C',     // Çok koyu arka plan
  card: '#2A2A2A',           // Koyu kart - light'tan daha koyu
  cardAlt: '#323232',        // Alternatif kart - biraz daha açık
  text: '#FAF7F2',           // Light tema background'u text olarak
  textLight: '#B8B5B0',      // Light tema text'inin açık versiyonu
  border: '#3A3A3A',         // Orta ton kenarlık
  success: '#6BB068',        // Success biraz daha açık
  error: '#D66B6B',          // Error biraz daha açık
  warning: '#E09B5F',        // Warning biraz daha açık
  info: '#6B8FB8',           // Info biraz daha açık
  input: '#2A2A2A'           // Card ile aynı
};

// 2. Modern Tema
export const modernColors: ColorPalette = {
  primary: '#6C63FF',        // Modern mor
  primaryLight: '#E1DEFF',
  primaryDark: '#4D47C3',
  secondary: '#00BFA6',      // Teal
  background: '#F8F9FD',
  card: '#FFFFFF',
  cardAlt: '#F1F3F8',
  text: '#212B36',
  textLight: '#637381',
  border: '#E0E6ED',
  success: '#34A853',
  error: '#EA4335',
  warning: '#FBBC05',
  info: '#4285F4',
  input: '#F8F9FD'
};

// Modern Dark Theme
export const darkModernColors: ColorPalette = {
  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  primaryDark: '#4D47C3',
  secondary: '#00BFA6',
  background: '#1A1D29',
  card: '#252837',
  cardAlt: '#2D3142',
  text: '#F8F9FD',
  textLight: '#9CA3AF',
  border: '#374151',
  success: '#34A853',
  error: '#EA4335',
  warning: '#FBBC05',
  info: '#4285F4',
  input: '#252837'
};

// 3. Futuristic Tema
export const futuristicColors: ColorPalette = {
  primary: '#0ABDE3',        // Siber mavi
  primaryLight: '#7FDFF9',
  primaryDark: '#0984B2',
  secondary: '#5F27CD',      // Mor
  background: '#171B26',     // Koyu arka plan
  card: '#23293B',
  cardAlt: '#2E364D',
  text: '#E5E9F0',
  textLight: '#94A1B2',
  border: '#394356',
  success: '#20BF6B',
  error: '#FC5C65',
  warning: '#FFD32A',
  info: '#45AAF2',
  input: '#171B26'
};

// 4. Retro Tema
export const retroColors: ColorPalette = {
  primary: '#FF6B6B',        // Retro kırmızı
  primaryLight: 'white',
  primaryDark: '#CC5252',
  secondary: '#4ECDC4',      // Turkuaz
  background: '#FFF8E6',     // Krem arka plan
  card: '#FFF1D6',
  cardAlt: '#FDEBD0',
  text: '#3D3D3D',
  textLight: '#7D7D7D',
  border: '#E0CDA9',
  success: '#78C850',
  error: '#FF5757',
  warning: '#FFB142',
  info: '#4A90E2',
  input: '#FFF8E6'
};

// Retro Dark Theme
export const darkRetroColors: ColorPalette = {
  primary: '#FF6B6B',
  primaryLight: 'white',
  primaryDark: '#CC5252',
  secondary: '#4ECDC4',
  background: '#2D2419',
  card: '#3D3025',
  cardAlt: '#4A3D2F',
  text: '#FFF8E6',
  textLight: '#C4B896',
  border: '#5A4D3A',
  success: '#78C850',
  error: '#FF5757',
  warning: '#FFB142',
  info: '#4A90E2',
  input: '#3D3025'
};

// Tema koleksiyonu
export const themeColors = {
  classic: {
    light: classicColors,
    dark: darkClassicColors
  },
  modern: {
    light: modernColors,
    dark: darkModernColors
  },
  futuristic: {
    light: futuristicColors,
    dark: futuristicColors // Futuristic tema zaten koyu
  },
  retro: {
    light: retroColors,
    dark: darkRetroColors
  }
} as const;

// Tema adları ve etiketleri
export const themeLabels: Record<ThemeName, string> = {
  classic: 'Klasik',
  modern: 'Modern',
  futuristic: 'Fütüristik',
  retro: 'Retro'
};

// Varsayılan tema
export const DEFAULT_THEME: ThemeName = 'classic';
export const DEFAULT_MODE: ThemeMode = 'light';

// Tema rengi alma fonksiyonu
export const getThemeColors = (themeName: ThemeName, mode: ThemeMode): ColorPalette => {
  return themeColors[themeName][mode];
};