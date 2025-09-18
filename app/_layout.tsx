import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthInitializer } from '@modules/auth';
import { NotificationInitializer } from '@modules/notifications';
import { ThemeProvider } from '@modules/theme';
import { useEffect } from 'react';
import { initializeFirebase } from '../config/firebase';

export const unstable_settings = {
  anchor: '(drawer)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Firebase'i uygulama başlangıcında başlat
  useEffect(() => {
    const initFirebase = async () => {
      console.log('🚀 Firebase başlatılıyor...');
      const success = await initializeFirebase();
      if (success) {
        console.log('✅ Firebase başarıyla başlatıldı');
      } else {
        console.error('❌ Firebase başlatılamadı');
      }
    };

    initFirebase();
  }, []);

  return (
    <ThemeProvider defaultTheme="classic" defaultMode={colorScheme || 'light'}>
      <AuthInitializer>
        <NotificationInitializer>
          <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="auto" />
          </NavigationThemeProvider>
        </NotificationInitializer>
      </AuthInitializer>
    </ThemeProvider>
  );
}
