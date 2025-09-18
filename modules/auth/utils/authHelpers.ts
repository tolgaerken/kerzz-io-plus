import { STORAGE_KEYS } from '../constants';
import { TUserInfo } from '../types/kerzz';
import { storage } from './storage';

/**
 * Phone number formatting utility
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Telefon numarasını temizle (sadece rakamlar)
  const cleanPhone = phoneNumber.replace(/\D/g, '');

  // Eğer zaten +90 ile başlıyorsa olduğu gibi döndür
  if (phoneNumber.startsWith('+90')) {
    return phoneNumber;
  }

  // Eğer 90 ile başlıyorsa + ekle
  if (cleanPhone.startsWith('90')) {
    return '+' + cleanPhone;
  }

  // Eğer 0 ile başlıyorsa 0'ı kaldır ve +90 ekle
  if (cleanPhone.startsWith('0')) {
    return '+90' + cleanPhone.substring(1);
  }

  // Diğer durumlarda direkt +90 ekle
  return '+90' + cleanPhone;
};

/**
 * Phone number validation
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10;
};

/**
 * OTP validation
 */
export const validateOTP = (otp: string): boolean => {
  return otp.trim().length > 0;
};

/**
 * Get stored user info from storage
 */
export const getStoredUserInfo = async (): Promise<TUserInfo | null> => {
  try {
    const storedUserInfo = await storage.getItem(STORAGE_KEYS.KERZZ_USER_INFO);
    if (!storedUserInfo) {
      return null;
    }
    return JSON.parse(storedUserInfo) as TUserInfo;
  } catch (error) {
    console.error('Error parsing stored user info:', error);
    return null;
  }
};

/**
 * Clear auth related storage
 */
export const clearAuthStorage = async (): Promise<void> => {
  await storage.removeItem(STORAGE_KEYS.KERZZ_TOKEN);
  await storage.removeItem(STORAGE_KEYS.KERZZ_USER_INFO);
  await storage.removeItem(STORAGE_KEYS.AUTH_STORAGE);
  await storage.removeItem('rememberMe');
};

/**
 * Check if user has required permissions
 */
export const hasPermission = (
  userInfo: TUserInfo | null | undefined,
  requiredPermission: string
): boolean => {
  if (!userInfo || !userInfo.licances || userInfo.licances.length === 0) {
    return false;
  }

  return userInfo.licances.some(licance =>
    licance.allPermissions?.some(permission =>
      permission.permission === requiredPermission
    )
  );
};

/**
 * Check if user has specific role
 */
export const hasRole = (
  userInfo: TUserInfo | null | undefined,
  requiredRole: string
): boolean => {
  if (!userInfo || !userInfo.licances || userInfo.licances.length === 0) {
    return false;
  }

  return userInfo.licances.some(licance =>
    licance.roles?.some(role => role.name === requiredRole)
  );
};

/**
 * Get user's primary license
 */
export const getPrimaryLicense = (userInfo: TUserInfo | null | undefined) => {
  if (!userInfo || !userInfo.licances || userInfo.licances.length === 0) {
    return null;
  }

  // Return the first active license or the first one if none are explicitly active
  return userInfo.licances.find(licance => licance.active !== false) || userInfo.licances[0];
};

/**
 * Generate display name from user info
 */
export const getDisplayName = (userInfo: TUserInfo | null | undefined): string => {
  if (!userInfo) {
    return 'Kullanıcı';
  }

  return userInfo.name || userInfo.mail || userInfo.phone || 'Kullanıcı';
};