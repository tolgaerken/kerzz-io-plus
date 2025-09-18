// Kerzz SSO API Constants
export const KERZZ_SSO = {
  APP_ID: '21aa-9637',
  BASE_URL: 'https://sso-service.kerzz.com:4500',
  // Environment variables'dan al, yoksa default değerleri kullan
  API_KEY: process.env.EXPO_PUBLIC_KERZZ_API_KEY || 'e5788b40-ec7e-0fe0-daf8-80c17445ab9d!?@f8a4!e347**11d3',
  USER_TOKEN: process.env.EXPO_PUBLIC_KERZZ_USER_TOKEN || 'your-user-token-here',
  ENDPOINTS: {
    LOGIN_BY_MAIL: '/api/login/loginByMail',
    AUTO_LOGIN: '/api/login/autoLogin',
    SEND_PASSWORD_MAIL: '/api/login/sendPasswordMail',
    REQUEST_OTP_SMS: '/api/login/requestOtpSms',
    VERIFY_OTP_SMS: '/api/login/verifyOtpSms',
    GET_USERS: '/api/user/getUsers',
    // Boss Users endpoints
    GET_EDOC_USERS: '/api/user/getusers',
    ADD_EDOC_USER: '/api/user/addUser',
    DELETE_BOSS_USER_LICENCE: '/api/user/deleteLicance',
    GET_ROLES: '/api/role/getRoles',
    GET_ROLES_BY_APP_ID: '/api/role/getRolesByAppId',
    GET_BRANCHES: '/api/helper/getBranchs',
    SEND_SMS: '/api/sms/send',
    SEND_EMAIL: '/api/email/send'
  }
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  KERZZ_TOKEN: 'kerzz_token',
  KERZZ_USER_INFO: 'kerzz_user_info',
  AUTH_STORAGE: 'auth-storage',
  THEME_STORAGE: 'theme-storage'
} as const

// API Headers
export const API_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  ACCEPT: 'Accept',
  API_KEY: 'x-api-key',
  USER_TOKEN: 'x-user-token'
} as const

// Environment configurations
export const ENV = {
  DEVELOPMENT: __DEV__,
  PRODUCTION: !__DEV__,
  API_TIMEOUT: Number(process.env.EXPO_PUBLIC_API_TIMEOUT) || 10000,
  API_TIMEOUT_LONG: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_LONG) || 120000
} as const