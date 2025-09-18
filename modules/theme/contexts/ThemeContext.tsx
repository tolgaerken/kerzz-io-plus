import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import {
    DEFAULT_MODE,
    DEFAULT_THEME,
    getThemeColors,
    themeLabels,
    ThemeMode,
    ThemeName
} from '../constants';
import { useResponsive } from '../hooks/useResponsive';
import {
    HeaderSizeType,
    ThemeContextType,
    ThemeProviderProps,
    ThemeType
} from '../types';
import { getResponsiveValue, THEME_STORAGE_KEYS, ThemeStorage } from '../utils';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = DEFAULT_THEME,
  defaultMode = DEFAULT_MODE
}) => {
  // Responsive hook'u kullan
  const { deviceInfo, fontSize, spacing, sizeFactor } = useResponsive();

  // Tema adı state'i
  const [themeName, setThemeName] = useState<ThemeName>(defaultTheme);
  const [themeMode, setThemeMode] = useState<ThemeMode>(defaultMode);
  const [isInitialized, setIsInitialized] = useState(false);

  // Başlangıçta storage'dan tema ayarlarını yükle
  useEffect(() => {
    const loadThemeSettings = async () => {
      try {
        // Tema adını yükle
        const savedThemeName = await ThemeStorage.getItem(THEME_STORAGE_KEYS.THEME_NAME) as ThemeName;
        if (savedThemeName && Object.keys(themeLabels).includes(savedThemeName)) {
          setThemeName(savedThemeName);
        }

        // Tema modunu yükle
        const savedThemeMode = await ThemeStorage.getItem(THEME_STORAGE_KEYS.THEME_MODE) as ThemeMode;
        if (savedThemeMode && ['light', 'dark'].includes(savedThemeMode)) {
          setThemeMode(savedThemeMode);
        } else {
          // Sistem tercihini kontrol et
          const systemColorScheme = Appearance.getColorScheme();
          if (systemColorScheme) {
            setThemeMode(systemColorScheme);
          }
        }
      } catch (error) {
        console.warn('Theme settings yüklenirken hata:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadThemeSettings();
  }, []);

  // Header boyutlarını hesapla
  const headerSize: HeaderSizeType = useMemo(() => ({
    h1: 24 * sizeFactor,
    h2: 20 * sizeFactor,
    h3: 18 * sizeFactor,
    h4: 16 * sizeFactor
  }), [sizeFactor]);

  // Cihaz tipini belirle
  const deviceType = useMemo(() => {
    if (deviceInfo.isPhone) return 'phone' as const;
    if (deviceInfo.isTablet) return 'tablet' as const;
    return 'web' as const;
  }, [deviceInfo]);

  // Ana tema objesini oluştur
  const theme: ThemeType = useMemo(() => ({
    colors: getThemeColors(themeName, themeMode),
    name: themeName,
    mode: themeMode,
    fontSize,
    headerSize,
    spacing,
    deviceType,
    sizeFactor
  }), [themeName, themeMode, fontSize, headerSize, spacing, deviceType, sizeFactor]);

  // Tema değiştirme fonksiyonları
  const handleSetTheme = async (name: ThemeName) => {
    setThemeName(name);
    await ThemeStorage.setItem(THEME_STORAGE_KEYS.THEME_NAME, name);
  };

  const handleSetMode = async (mode: ThemeMode) => {
    setThemeMode(mode);
    await ThemeStorage.setItem(THEME_STORAGE_KEYS.THEME_MODE, mode);
  };

  const toggleMode = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    handleSetMode(newMode);
  };

  // Responsive değer alma fonksiyonu
  const getResponsiveValueFn = <T,>(options: any): T => {
    return getResponsiveValue(options, deviceInfo);
  };

  // Sistem tema değişikliklerini dinle (React Native)
  useEffect(() => {
    const subscription = Appearance.addChangeListener(async ({ colorScheme }) => {
      // Sadece storage'da tema modu kayıtlı değilse sistem tercihini kullan
      const savedMode = await ThemeStorage.getItem(THEME_STORAGE_KEYS.THEME_MODE);
      if (!savedMode && colorScheme) {
        setThemeMode(colorScheme);
      }
    });

    return () => subscription.remove();
  }, []);

  const value: ThemeContextType = {
    theme,
    themeName,
    themeMode,
    isDarkMode: themeMode === 'dark',
    setTheme: handleSetTheme,
    setMode: handleSetMode,
    toggleMode,
    deviceInfo,
    getResponsiveValue: getResponsiveValueFn
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};