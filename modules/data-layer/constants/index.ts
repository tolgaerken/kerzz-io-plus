// MongoDB API Configuration
export const MONGO_API = {
  BASE_URL: import.meta.env.REACT_APP_DB_URL || 'https://public.kerzz.com:50502/api/database/dataAction',
  TIMEOUT: 30000,
} as const

// Socket Configuration
export const SOCKET_CONFIG = {
  URL: 'https://public.kerzz.com:50503',
  AUTH: {
    ALIAS: 'ali-yilmaz',
    SECRET_KEY: '14531453'
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
  DEVELOPMENT: import.meta.env.DEV,
  PRODUCTION: import.meta.env.PROD,
  API_TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
  API_TIMEOUT_LONG: Number(import.meta.env.VITE_API_TIMEOUT_LONG) || 120000
} as const