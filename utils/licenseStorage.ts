import AsyncStorage from '@react-native-async-storage/async-storage';

const LICENSE_STORAGE_KEY = 'selected_license';

export const licenseManager = {
  getCurrentLicense: async (): Promise<any | null> => {
    try {
      const license = await AsyncStorage.getItem(LICENSE_STORAGE_KEY);
      return license ? JSON.parse(license) : null;
    } catch (error) {
      console.error('License okuma hatası:', error);
      return null;
    }
  },

  setCurrentLicense: async (license: any): Promise<void> => {
    try {
      await AsyncStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(license));
    } catch (error) {
      console.error('License kaydetme hatası:', error);
    }
  },

  clearCurrentLicense: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(LICENSE_STORAGE_KEY);
    } catch (error) {
      console.error('License temizleme hatası:', error);
    }
  },

  reset: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(LICENSE_STORAGE_KEY);
    } catch (error) {
      console.error('License reset hatası:', error);
    }
  }
};
