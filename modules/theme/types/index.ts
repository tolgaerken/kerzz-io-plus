export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  background: string;
  card: string;
  cardAlt: string;
  text: string;
  textLight: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  input: string;
}

export interface FontSizeType {
  tiny: number;      // 10px * sizeFactor
  small: number;     // 12px * sizeFactor
  medium: number;    // 14px * sizeFactor
  regular: number;   // 16px * sizeFactor
  large: number;     // 18px * sizeFactor
  xlarge: number;    // 20px * sizeFactor
  xxlarge: number;   // 24px * sizeFactor
  xxxlarge: number;  // 30px * sizeFactor
}

export interface HeaderSizeType {
  h1: number;        // 24px * sizeFactor
  h2: number;        // 20px * sizeFactor
  h3: number;        // 18px * sizeFactor
  h4: number;        // 16px * sizeFactor
}

export interface SpacingType {
  tiny: number;      // 4px * sizeFactor
  small: number;     // 8px * sizeFactor
  medium: number;    // 12px * sizeFactor
  regular: number;   // 16px * sizeFactor
  large: number;     // 20px * sizeFactor
  xlarge: number;    // 24px * sizeFactor
}

export type DeviceType = 'tablet' | 'web' | 'phone';

export interface ThemeType {
  colors: ColorPalette;
  name: ThemeName;
  mode: ThemeMode;
  fontSize: FontSizeType;
  headerSize: HeaderSizeType;
  spacing: SpacingType;
  deviceType: DeviceType;
  sizeFactor: number;
}

export interface DeviceInfo {
  isPhone: boolean;
  isTablet: boolean;
  isWeb: boolean;
  isLargeScreen: boolean;
  isSmallScreen: boolean;
  width: number;
  height: number;
}

export interface BreakpointType {
  phone: number;        // 480px - Telefon maksimum genişlik
  tablet: number;       // 768px - Tablet maksimum genişlik
  largeTablet: number;  // 1024px - Büyük tablet
  desktop: number;      // 1200px - Masaüstü
}

export interface StyleOptions<T = any> {
  phone?: T;
  tablet?: T;
  web?: T;
  default?: T;
}

export interface ShadowType {
  light: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  medium: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  heavy: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

export interface BorderRadiusType {
  small: number;
  medium: number;
  large: number;
  xlarge: number;
  full: number;
}

export interface ThemeContextType {
  theme: ThemeType;
  themeName: ThemeName;
  themeMode: ThemeMode;
  isDarkMode: boolean;
  setTheme: (name: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  deviceInfo: DeviceInfo;
  getResponsiveValue: <T>(options: StyleOptions<T>) => T;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
  defaultMode?: ThemeMode;
}

export interface UseStylesReturn {
  theme: ThemeType;
  colors: ColorPalette;
  fontSize: FontSizeType;
  headerSize: HeaderSizeType;
  spacing: SpacingType;
  shadows: ShadowType;
  borderRadius: BorderRadiusType;
  deviceInfo: DeviceInfo;
  getResponsiveValue: <T>(options: StyleOptions<T>) => T;
  common: CommonStyleType;
  button: ButtonStyleType;
  card: CardStyleType;
  form: FormStyleType;
}

export interface UseResponsiveReturn {
  deviceInfo: DeviceInfo;
  fontSize: FontSizeType;
  spacing: SpacingType;
  sizeFactor: number;
  styleByDevice: <T>(styles: StyleOptions<T>) => T;
  styleByWidth: <T>(styles: { [key: number]: T }) => T;
  isAbove: (breakpoint: keyof BreakpointType) => boolean;
  isBelow: (breakpoint: keyof BreakpointType) => boolean;
}

export interface ButtonStyleType {
  primary: any;
  secondary: any;
  success: any;
  warning: any;
  error: any;
  outline: any;
  ghost: any;
  link: any;
}

export interface CardStyleType {
  default: any;
  elevated: any;
  accent: any;
  bordered: any;
  flat: any;
}

export interface CommonStyleType {
  container: any;
  centeredContainer: any;
  rowContainer: any;
  columnContainer: any;
  flexCenter: any;
  flexBetween: any;
  flexStart: any;
  flexEnd: any;
}

export interface FormStyleType {
  input: any;
  textarea: any;
  select: any;
  checkbox: any;
  radio: any;
  label: any;
  errorText: any;
  helperText: any;
}

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  colors: {
    light: ColorPalette;
    dark: ColorPalette;
  };
  preview: {
    primary: string;
    secondary: string;
    background: string;
  };
}

export type ThemeName = 'classic' | 'modern' | 'futuristic' | 'retro' | 'cozzy';
export type ThemeMode = 'light' | 'dark';