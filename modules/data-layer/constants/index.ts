import Constants from 'expo-constants';

// React Native Environment Helper
const getEnvVar = (key: string, defaultValue?: string): string => {
  // Expo Constants'tan environment variable'ları al
  const expoConfig = Constants.expoConfig;
  const extra = expoConfig?.extra || {};
  
  // Önce expo extra'dan, sonra process.env'den, son olarak default'tan al
  return extra[key] || process.env[key] || defaultValue || '';
};

// MongoDB API Configuration
export const MONGO_API = {
  BASE_URL: getEnvVar('EXPO_PUBLIC_DB_URL', 'https://public.kerzz.com:50502/api/database/dataAction'),
  TIMEOUT: 30000,
} as const

// Socket Configuration
export const SOCKET_CONFIG = {
  URL: getEnvVar('EXPO_PUBLIC_SOCKET_URL', 'https://public.kerzz.com:50503'),
  AUTH: {
    ALIAS: getEnvVar('EXPO_PUBLIC_SOCKET_ALIAS', 'ali-yilmaz'),
    SECRET_KEY: getEnvVar('EXPO_PUBLIC_SOCKET_SECRET', '14531453')
  },
  RECONNECTION: {
    ENABLED: true,
    DELAY: 1000,
    DELAY_MAX: 5000,
    ATTEMPTS: Infinity,
  },
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,
  },
  THROTTLE_TIME: 1000, // 1 second
} as const

// API Headers (for data operations)
export const API_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  ACCEPT: 'Accept',
  API_KEY: 'x-api-key',
  USER_TOKEN: 'x-user-token'
} as const

// Environment configurations
export const ENV = {
  DEVELOPMENT: __DEV__, // React Native'de __DEV__ kullanılır
  PRODUCTION: !__DEV__,
  API_TIMEOUT: Number(getEnvVar('EXPO_PUBLIC_API_TIMEOUT', '10000')),
  API_TIMEOUT_LONG: Number(getEnvVar('EXPO_PUBLIC_API_TIMEOUT_LONG', '120000'))
} as const

// React Native specific configurations
export const RN_CONFIG = {
  // Network timeout for React Native
  NETWORK_TIMEOUT: 30000,
  
  // Logging configuration
  ENABLE_LOGS: __DEV__,
  
  // AsyncStorage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: '@kerzz/auth_token',
    USER_INFO: '@kerzz/user_info',
    SOCKET_STATE: '@kerzz/socket_state'
  },
  
  // React Native specific socket options
  SOCKET_OPTIONS: {
    forceNew: true,
    transports: ['websocket' as const], // React Native'de websocket tercih edilir
    upgrade: false,
    rememberUpgrade: false
  }
} as const