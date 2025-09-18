import { DeviceInfo, DeviceType, FontSizeType, SpacingType, StyleOptions } from '../types';

// Cihaz tipini belirleme fonksiyonu
export const getDeviceType = (width: number): DeviceType => {
  if (width <= 480) return 'phone';
  if (width <= 768) return 'tablet';
  return 'web';
};

// Boyut faktörünü hesaplama
export const getSizeFactor = (deviceType: DeviceType): number => {
  switch (deviceType) {
    case 'tablet':
      return 1.5;
    case 'web':
      return 1.2;
    case 'phone':
    default:
      return 1;
  }
};

// Font boyutlarını hesaplama
export const calculateFontSizes = (sizeFactor: number): FontSizeType => ({
  tiny: 10 * sizeFactor,
  small: 12 * sizeFactor,
  medium: 14 * sizeFactor,
  regular: 16 * sizeFactor,
  large: 18 * sizeFactor,
  xlarge: 20 * sizeFactor,
  xxlarge: 24 * sizeFactor,
  xxxlarge: 30 * sizeFactor
});

// Boşluk değerlerini hesaplama
export const calculateSpacing = (sizeFactor: number): SpacingType => ({
  tiny: 4 * sizeFactor,
  small: 8 * sizeFactor,
  medium: 12 * sizeFactor,
  regular: 16 * sizeFactor,
  large: 20 * sizeFactor,
  xlarge: 24 * sizeFactor
});

// React Native uyumlu ekran boyutunu alma
export const getScreenSize = () => {
  // React Native'de Dimensions kullanılacak, bu fonksiyon artık kullanılmayacak
  // Geriye uyumluluk için bırakıldı
  if (typeof window !== 'undefined') {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }
  
  return { width: 1200, height: 800 }; // Varsayılan değerler
};

// Responsive değer alma yardımcı fonksiyonu
export const getResponsiveValue = <T>(
  options: StyleOptions<T>,
  deviceInfo: DeviceInfo
): T => {
  if (deviceInfo.isPhone && options.phone !== undefined) {
    return options.phone;
  }
  if (deviceInfo.isTablet && options.tablet !== undefined) {
    return options.tablet;
  }
  if (deviceInfo.isWeb && options.web !== undefined) {
    return options.web;
  }
  return options.default as T;
};