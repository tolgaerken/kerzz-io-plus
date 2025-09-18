import { useEffect, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';
import { BREAKPOINTS } from '../constants';
import type {
    BreakpointType,
    DeviceInfo,
    StyleOptions,
    UseResponsiveReturn
} from '../types';
import {
    calculateFontSizes,
    calculateSpacing,
    getDeviceType,
    getSizeFactor
} from '../utils';

// React Native uyumlu screen size alma
const getScreenSize = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

export const useResponsive = (): UseResponsiveReturn => {
  const [screenSize, setScreenSize] = useState(getScreenSize);

  // Ekran boyutu değişikliklerini dinle
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenSize({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  // Cihaz bilgilerini hesapla
  const deviceInfo: DeviceInfo = useMemo(() => {
    const { width, height } = screenSize;
    const isPhone = width <= BREAKPOINTS.phone;
    const isTablet = width > BREAKPOINTS.phone && width <= BREAKPOINTS.tablet;
    const isWeb = width > BREAKPOINTS.tablet;
    const isLargeScreen = width > BREAKPOINTS.largeTablet;
    const isSmallScreen = width <= BREAKPOINTS.phone;

    return {
      isPhone,
      isTablet,
      isWeb,
      isLargeScreen,
      isSmallScreen,
      width,
      height
    };
  }, [screenSize]);

  // Cihaz tipi ve boyut faktörü
  const deviceType = useMemo(() => getDeviceType(screenSize.width), [screenSize.width]);
  const sizeFactor = useMemo(() => getSizeFactor(deviceType), [deviceType]);

  // Font boyutları ve boşluklar
  const fontSize = useMemo(() => calculateFontSizes(sizeFactor), [sizeFactor]);
  const spacing = useMemo(() => calculateSpacing(sizeFactor), [sizeFactor]);

  // Cihaza göre stil seçme
  const styleByDevice = <T>(styles: StyleOptions<T>): T => {
    if (deviceInfo.isPhone && styles.phone !== undefined) {
      return styles.phone;
    }
    if (deviceInfo.isTablet && styles.tablet !== undefined) {
      return styles.tablet;
    }
    if (deviceInfo.isWeb && styles.web !== undefined) {
      return styles.web;
    }
    return styles.default as T;
  };

  // Genişliğe göre stil seçme
  const styleByWidth = <T>(styles: { [key: number]: T }): T => {
    const sortedBreakpoints = Object.keys(styles)
      .map(Number)
      .sort((a, b) => b - a); // Büyükten küçüğe sırala

    for (const breakpoint of sortedBreakpoints) {
      if (screenSize.width >= breakpoint) {
        return styles[breakpoint];
      }
    }

    // Hiçbir breakpoint uymazsa en küçük değeri döndür
    const minBreakpoint = Math.min(...sortedBreakpoints);
    return styles[minBreakpoint];
  };

  // Breakpoint kontrolleri
  const isAbove = (breakpoint: keyof BreakpointType): boolean => {
    return screenSize.width > BREAKPOINTS[breakpoint];
  };

  const isBelow = (breakpoint: keyof BreakpointType): boolean => {
    return screenSize.width <= BREAKPOINTS[breakpoint];
  };

  return {
    deviceInfo,
    fontSize,
    spacing,
    sizeFactor,
    styleByDevice,
    styleByWidth,
    isAbove,
    isBelow
  };
};

// Breakpoint hook'u
export const useBreakpoint = () => {
  const { deviceInfo, isAbove, isBelow } = useResponsive();

  return {
    ...deviceInfo,
    isAbove,
    isBelow,
    // Kısa yollar
    isMobile: deviceInfo.isPhone,
    isDesktop: deviceInfo.isWeb,
    isTabletUp: deviceInfo.isTablet || deviceInfo.isWeb,
    isMobileDown: deviceInfo.isPhone,
    isTabletDown: deviceInfo.isPhone || deviceInfo.isTablet
  };
};

export default useResponsive;