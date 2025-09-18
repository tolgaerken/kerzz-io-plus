import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * React Native uyumlu storage utility
 * Web'de localStorage, React Native'de AsyncStorage kullanır
 */

export class ThemeStorage {
  private static isWeb = Platform.OS === 'web';

  /**
   * Değer okuma
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      if (this.isWeb && typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn(`ThemeStorage.getItem error for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Değer yazma
   */
  static async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isWeb && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn(`ThemeStorage.setItem error for key "${key}":`, error);
    }
  }

  /**
   * Değer silme
   */
  static async removeItem(key: string): Promise<void> {
    try {
      if (this.isWeb && typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn(`ThemeStorage.removeItem error for key "${key}":`, error);
    }
  }

  /**
   * Senkron okuma (sadece web'de, React Native'de null döner)
   */
  static getItemSync(key: string): string | null {
    if (this.isWeb && typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn(`ThemeStorage.getItemSync error for key "${key}":`, error);
        return null;
      }
    }
    return null;
  }

  /**
   * Senkron yazma (sadece web'de, React Native'de hiçbir şey yapmaz)
   */
  static setItemSync(key: string, value: string): void {
    if (this.isWeb && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn(`ThemeStorage.setItemSync error for key "${key}":`, error);
      }
    }
  }
}

// Storage anahtarları
export const THEME_STORAGE_KEYS = {
  THEME_NAME: 'theme-name',
  THEME_MODE: 'theme-mode',
  THEME_PREFERENCES: 'theme-preferences'
} as const;
