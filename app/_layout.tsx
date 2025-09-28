import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthInitializer } from '@modules/auth';
import { NotificationInitializer } from '@modules/notifications';
import { ThemeProvider } from '@modules/theme';
import { useEffect, useState } from 'react';
import { initializeFirebase } from '../config/firebase';

// QueryClient'i oluştur
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 dakika
      gcTime: 10 * 60 * 1000, // 10 dakika (eski adı: cacheTime)
      retry: (failureCount, error) => {
        // Network hatalarında 3 kez dene
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

export const unstable_settings = {
  anchor: '(drawer)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [firebaseReady, setFirebaseReady] = useState(false);

  // Firebase ve Notification sistemini uygulama başlangıcında başlat
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Uygulama başlatılıyor...');
      
      // Firebase'i başlat
      console.log('🔥 Firebase başlatılıyor...');
      const firebaseSuccess = await initializeFirebase();
      if (firebaseSuccess) {
        console.log('✅ Firebase başarıyla başlatıldı');
        setFirebaseReady(true);
      } else {
        console.error('❌ Firebase başlatılamadı');
      }
    };

    initializeApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="classic" defaultMode={colorScheme || 'light'}>
        <AuthInitializer>
          {firebaseReady ? (
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
          ) : (
            <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
              <StatusBar style="auto" />
            </NavigationThemeProvider>
          )}
        </AuthInitializer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
