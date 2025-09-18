import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * React Native için localStorage/sessionStorage wrapper
 * Web API'sini taklit eder ancak async çalışır
 */
export class StorageWrapper {
  private static instance: StorageWrapper;
  private cache: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): StorageWrapper {
    if (!StorageWrapper.instance) {
      StorageWrapper.instance = new StorageWrapper();
    }
    return StorageWrapper.instance;
  }

  /**
   * Async getItem - React Native AsyncStorage kullanır
   */
  async getItem(key: string): Promise<string | null> {
    try {
      // Önce cache'den kontrol et
      if (this.cache.has(key)) {
        return this.cache.get(key) || null;
      }

      const value = await AsyncStorage.getItem(key);
      if (value) {
        this.cache.set(key, value);
      }
      return value;
    } catch (error) {
      console.warn(`Storage getItem hatası (${key}):`, error);
      return null;
    }
  }

  /**
   * Async setItem - React Native AsyncStorage kullanır
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
      this.cache.set(key, value);
    } catch (error) {
      console.warn(`Storage setItem hatası (${key}):`, error);
    }
  }

  /**
   * Async removeItem - React Native AsyncStorage kullanır
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      this.cache.delete(key);
    } catch (error) {
      console.warn(`Storage removeItem hatası (${key}):`, error);
    }
  }

  /**
   * Sync getItem - cache'den okur, yoksa null döner
   * Sadece acil durumlar için, async versiyonu tercih edilmeli
   */
  getItemSync(key: string): string | null {
    return this.cache.get(key) || null;
  }

  /**
   * Cache'i temizle
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Tüm storage'ı temizle
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      this.cache.clear();
    } catch (error) {
      console.warn('Storage clear hatası:', error);
    }
  }
}

// Singleton instance
export const storage = StorageWrapper.getInstance();

// React Native için localStorage benzeri interface
export const localStorage = {
  getItem: (key: string) => storage.getItemSync(key),
  setItem: async (key: string, value: string) => await storage.setItem(key, value),
  removeItem: async (key: string) => await storage.removeItem(key),
  clear: async () => await storage.clear()
};

export const sessionStorage = localStorage; // React Native'de aynı storage kullanılır
