import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWeb: boolean;
  width: number;
  height: number;
}

interface ResponsiveStyles {
  default: string;
  phone?: string;
  tablet?: string;
  desktop?: string;
}

export const useResponsive = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isWeb: true,
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setDeviceInfo({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isWeb: true,
        width,
        height,
      });
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);

    return () => window.removeEventListener('resize', updateDeviceInfo);
  }, []);

  const styleByDevice = (styles: ResponsiveStyles): string => {
    if (deviceInfo.isMobile && styles.phone) {
      return styles.phone;
    }
    if (deviceInfo.isTablet && styles.tablet) {
      return styles.tablet;
    }
    if (deviceInfo.isDesktop && styles.desktop) {
      return styles.desktop;
    }
    return styles.default;
  };

  return {
    deviceInfo,
    styleByDevice,
  };
};