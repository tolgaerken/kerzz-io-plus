import { useRouter, useSegments } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireFirstLogin?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireFirstLogin = false,
  redirectTo
}) => {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isFirstLogin, isInitializing } = useAuthStore();

  React.useEffect(() => {
    if (isInitializing) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (requireAuth && !isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (requireAuth && isAuthenticated && isFirstLogin && !requireFirstLogin) {
      router.replace('/setup');
    } else if (requireFirstLogin && (!isAuthenticated || !isFirstLogin)) {
      router.replace(redirectTo || '/');
    } else if (!requireAuth && isAuthenticated && inAuthGroup) {
      router.replace(redirectTo || '/');
    }
  }, [isAuthenticated, isFirstLogin, isInitializing, segments, router, requireAuth, requireFirstLogin, redirectTo]);

  // If still initializing, show loading
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
});

export default ProtectedRoute;