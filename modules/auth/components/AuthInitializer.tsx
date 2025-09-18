import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../stores/authStore';

interface AuthInitializerProps {
  children: React.ReactNode;
  onInitialized?: () => void;
  loadingComponent?: React.ComponentType;
}

const DefaultLoadingComponent: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.loadingText}>Yükleniyor...</Text>
  </View>
);

const AuthInitializer: React.FC<AuthInitializerProps> = ({
  children,
  onInitialized,
  loadingComponent: LoadingComponent = DefaultLoadingComponent
}) => {
  const { isInitializing, error, initializeAuth } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      console.log('🚀 AuthInitializer: Auth kontrolü başlatılıyor...');
      await initializeAuth();
      console.log('🏁 AuthInitializer: Auth başlatma tamamlandı');

      if (onInitialized) {
        onInitialized();
      }
    };

    initAuth();
  }, [initializeAuth, onInitialized]);

  if (isInitializing) {
    return (
      <View style={styles.initializingContainer}>
        <LoadingComponent />
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
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
  initializingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#dc3545',
    textAlign: 'center',
  },
});

export default AuthInitializer;