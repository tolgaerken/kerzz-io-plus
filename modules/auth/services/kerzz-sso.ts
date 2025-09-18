import axios, { isAxiosError } from 'axios'
import { jwtDecode } from 'jwt-decode'
import { API_HEADERS, ENV, KERZZ_SSO, STORAGE_KEYS } from '../constants'
import { APP_USER, TUserInfo } from '../types/kerzz'
import { storage } from '../utils/storage'

// API yanıt tiplerini tanımlayalım
export interface KerzzLoginResponse {
  success: boolean
  token?: string
  userInfo?: TUserInfo
  user?: {
    id: string
    email: string
    name: string
    avatar?: string
  }
  message?: string
  error?: string
}

export interface KerzzOtpResponse {
  success: boolean
  message?: string
  error?: string
}

export interface KerzzAutoLoginResponse {
  success: boolean
  token?: string
  userInfo?: TUserInfo
  user?: {
    id: string
    email: string
    name: string
    avatar?: string
  }
  message?: string
  error?: string
}

// Platform detection for React Native
const isReactNative = () => {
  return typeof navigator === 'undefined' || navigator.product === 'ReactNative';
};

// Safari detection
const isSafari = () => {
  if (isReactNative()) return false;
  return typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

// Axios instance oluşturalım
const kerzzAPI = axios.create({
  baseURL: KERZZ_SSO.BASE_URL,
  timeout: isReactNative() ? 15000 : ENV.API_TIMEOUT, // React Native'de daha uzun timeout
  headers: {
    [API_HEADERS.CONTENT_TYPE]: 'application/json',
    [API_HEADERS.ACCEPT]: 'application/json',
    [API_HEADERS.API_KEY]: KERZZ_SSO.API_KEY,
    [API_HEADERS.USER_TOKEN]: KERZZ_SSO.USER_TOKEN
  },
  // Safari'ye özel ayarlar
  ...(isSafari() && {
    withCredentials: false, // Safari'de CORS sorunlarını önlemek için
    maxRedirects: 0 // Safari'de redirect sorunlarını önlemek için
  })
})

// Access token'ı her isteğe eklemek için interceptor
kerzzAPI.interceptors.request.use(
  async (config) => {
    const storedAuthData = await storage.getItem('auth-storage')
    if (storedAuthData) {
      try {
        const authData = JSON.parse(storedAuthData)
        const accessToken = authData?.state?.userInfo?.accessToken
        if (accessToken) {
          config.headers = config.headers || {}
          ;(config.headers as any)[API_HEADERS.USER_TOKEN] = accessToken
        }
      } catch {
        // yoksay
      }
    }
    
    // Safari'ye özel header düzenlemeleri
    if (isSafari()) {
      config.headers = config.headers || {}
      // Safari'de bazı header'lar sorun çıkarabilir
      config.headers['Cache-Control'] = 'no-cache'
      config.headers['Pragma'] = 'no-cache'
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - Safari'ye özel hata yönetimi
kerzzAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isSafari() && error.code === 'ERR_NETWORK') {
      console.warn('⚠️ Safari network hatası tespit edildi:', error.message);
      // Safari'de network hatalarını daha açıklayıcı hale getir
      error.message = 'Safari\'de bağlantı sorunu. Lütfen sayfayı yenileyin veya farklı bir tarayıcı deneyin.';
    }
    return Promise.reject(error);
  }
)

/**
 * E-posta ile giriş yapma
 * @param email - Kullanıcı e-posta adresi
 * @param password - Kullanıcı şifresi
 * @param rememberMe - Beni hatırla seçeneği
 * @returns Promise<KerzzLoginResponse>
 */
export const loginByMail = async (email: string, password: string, rememberMe: boolean = false): Promise<KerzzLoginResponse> => {
  try {
    const response = await kerzzAPI.post(KERZZ_SSO.ENDPOINTS.LOGIN_BY_MAIL, {
      email,
      password
    })

    // Eğer token varsa işlem başarılı demektir
    if (response.data.token) {
      // JWT token'ı decode et
      const decodedToken = jwtDecode<any>(response.data.token)
      const userInfo: TUserInfo = decodedToken.userInfo

      // Token'ı sakla
      await storage.setItem(STORAGE_KEYS.KERZZ_TOKEN, response.data.token)
      if (rememberMe) {
        await storage.setItem('rememberMe', 'true')
      } else {
        await storage.removeItem('rememberMe')
      }

      // Response'u standart formata çevir
      return {
        success: true,
        token: response.data.token,
        userInfo: userInfo
      }
    }

    // Token yoksa hata
    return {
      success: false,
      message: 'Token alınamadı'
    }
  } catch (error) {
    console.error('Kerzz loginByMail hatası:', error)
    
    if (isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Giriş işlemi başarısız'
      throw new Error(errorMessage)
    }
    
    throw new Error('Ağ hatası: Sunucuya bağlanılamadı')
  }
}

/**
 * Otomatik giriş (token ile)
 * @param token - Kullanıcı token'ı (opsiyonel, localStorage'dan alınır)
 * @returns Promise<KerzzAutoLoginResponse>
 */
export const autoLogin = async (token?: string): Promise<KerzzAutoLoginResponse> => {
  console.log('🔧 Kerzz SSO autoLogin fonksiyonu çağrıldı')
  
  try {
    const authToken = token || getStoredToken()
    console.log('🎫 SSO token kontrolü:', authToken ? 'Token var' : 'Token yok')
    
    if (!authToken) {
      console.log('❌ SSO: Token bulunamadı')
      throw new Error('Token bulunamadı')
    }

    console.log('🚀 API çağrısı yapılıyor - Endpoint:', KERZZ_SSO.ENDPOINTS.AUTO_LOGIN)
    
    // API'ye autologin çağrısı yap (token yenilenmesi için)
    const response = await kerzzAPI.post(KERZZ_SSO.ENDPOINTS.AUTO_LOGIN, {
      token: authToken
    })
    
    console.log('📨 API response alındı:', response.data)

    // API'den gelen response'u kontrol et (response.data direkt TUserInfo)
    if (response.data && response.data.accessToken) {
      // response.data direkt TUserInfo tipinde
      const userInfo: TUserInfo = response.data

      // AccessToken'ı token olarak sakla
      await storage.setItem(STORAGE_KEYS.KERZZ_TOKEN, userInfo.accessToken)

      console.log('✅ AutoLogin başarılı, direkt TUserInfo alındı')
      
      return {
        success: true,
        userInfo: userInfo,
        token: userInfo.accessToken
      }
    } else {
      // API'den başarısız response geldi
      throw new Error('Otomatik giriş başarısız - UserInfo alınamadı')
    }
  } catch (error) {
    console.error('Kerzz autoLogin hatası:', error)
    
    // Token geçersizse temizleyelim
    await clearStoredToken()
    
    if (isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Otomatik giriş başarısız'
      throw new Error(errorMessage)
    }
    
    throw new Error(error instanceof Error ? error.message : 'Otomatik giriş başarısız')
  }
}

/**
 * Çıkış yapma ve token'ı temizleme
 */
export const logout = async (): Promise<void> => {
  await clearStoredToken()
  await storage.removeItem(STORAGE_KEYS.KERZZ_USER_INFO)
}

/**
 * Mevcut token'ı getir (AsyncStorage'dan)
 */
export const getStoredToken = async (): Promise<string | null> => {
  const token = await storage.getItem(STORAGE_KEYS.KERZZ_TOKEN)
  
  console.log('🔍 Token arama:', {
    token: token ? 'Var' : 'Yok',
    storageKey: STORAGE_KEYS.KERZZ_TOKEN
  })
  
  return token
}

/**
 * Sync token getter - cache'den okur
 */
export const getStoredTokenSync = (): string | null => {
  return storage.getItemSync(STORAGE_KEYS.KERZZ_TOKEN)
}

/**
 * Token'ı temizle (hem localStorage hem sessionStorage'dan)
 */
export const clearStoredToken = async (): Promise<void> => {
  await storage.removeItem(STORAGE_KEYS.KERZZ_TOKEN)
  await storage.removeItem('rememberMe')
}

/**
 * Kullanıcı listesini getirir
 * Body: { licance_id: string }
 */
export const getUsers = async (licanceId: string): Promise<{ success: boolean; data?: APP_USER[]; message?: string; error?: string }> => {
  try {
    const response = await kerzzAPI.post<APP_USER[]>(KERZZ_SSO.ENDPOINTS.GET_USERS, {
      licance_id: licanceId
    })

    if (response.data && Array.isArray(response.data)) {
      return { success: true, data: response.data }
    }
    return { success: false, message: 'Kullanıcı listesi alınamadı' }
  } catch (error) {
    console.error('getUsers hatası:', error)
    if (isAxiosError(error)) {
      const err = error.response?.data as any
      return { success: false, error: (err?.message || err?.error || 'Kullanıcı listesi alınamadı') as string }
    }
    return { success: false, error: 'Ağ hatası: Sunucuya bağlanılamadı' }
  }
}

/**
 * Token'ın süresinin dolup dolmadığını kontrol eder
 */
export const isTokenExpired = (token?: string): boolean => {
  try {
    const authToken = token || getStoredTokenSync()
    if (!authToken) return true

    const decodedToken = jwtDecode<any>(authToken)
    const currentTime = Date.now() / 1000
    
    // Token'ın süresi dolmuş mu kontrol et (5 dakika önce refresh için)
    return decodedToken.exp < (currentTime + 300) // 5 dakika buffer
  } catch (error) {
    console.error('Token decode hatası:', error)
    return true
  }
}

/**
 * Token'ı otomatik olarak yeniler (süresi dolmak üzereyse)
 */
export const refreshTokenIfNeeded = async (): Promise<boolean> => {
  try {
    const currentToken = await getStoredToken()
    if (!currentToken) return false

    // Token'ın süresi dolmuş veya dolmak üzere mi?
    if (isTokenExpired(currentToken)) {
      console.log('Token süresi doldu, yenileniyor...')
      const response = await autoLogin(currentToken)
      return response.success
    }
    
    return true // Token hala geçerli
  } catch (error) {
    console.error('Token yenileme hatası:', error)
    console.log('🧹 Token yenileme başarısız, token temizleniyor...')
    
    // Token yenileme başarısız olursa token'ı temizle
    await clearStoredToken()
    return false
  }
}

/**
 * Şifre sıfırlama e-postası gönder
 * @param email - Kullanıcı e-posta adresi
 * @returns Promise<{ success: boolean, message?: string }>
 */
export const sendPasswordResetMail = async (email: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await kerzzAPI.post(KERZZ_SSO.ENDPOINTS.SEND_PASSWORD_MAIL, {
      email
    })

    return {
      success: true,
      message: response.data.message || 'Şifre sıfırlama e-postası gönderildi'
    }
  } catch (error) {
    console.error('Şifre sıfırlama e-postası gönderme hatası:', error)
    
    if (isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Şifre sıfırlama e-postası gönderilemedi'
      return {
        success: false,
        message: errorMessage
      }
    }
    
    return {
      success: false,
      message: 'Ağ hatası: Sunucuya bağlanılamadı'
    }
  }
}

/**
 * Periyodik token kontrolü başlatır
 */
export const startTokenRefreshInterval = (): number => {
  // Her 2 dakikada bir token kontrolü yap
  return setInterval(async () => {
    await refreshTokenIfNeeded()
  }, 2 * 60 * 1000) // 2 dakika
}

/**
 * Safari uyumlu localStorage erişimi
 * Safari'de localStorage erişimi bazen başarısız olabilir
 */
const safeGetLocalStorage = async (key: string): Promise<string | null> => {
  try {
    // React Native'de AsyncStorage kullanıyoruz, Storage kontrolü gereksiz
    const value = await storage.getItem(key)
    return value
  } catch (error) {
    console.warn('⚠️ AsyncStorage erişim hatası:', error)
    return null
  }
}

/**
 * Safari uyumlu localStorage yazma
 */
const safeSetLocalStorage = async (key: string, value: string): Promise<boolean> => {
  try {
    await storage.setItem(key, value)
    return true
  } catch (error) {
    console.warn('⚠️ AsyncStorage yazma hatası:', error)
    return false
  }
}

/**
 * localStorage'dan TUserInfo ile auto login
 * @returns Promise<KerzzAutoLoginResponse>
 */
export const autoLoginFromStorage = async (): Promise<KerzzAutoLoginResponse> => {
  try {
    console.log('🔧 localStorage\'dan auto login başlatılıyor...')
    
    // Safari uyumlu localStorage erişimi
    const storedUserInfo = await safeGetLocalStorage(STORAGE_KEYS.KERZZ_USER_INFO)
    
    if (!storedUserInfo) {
      console.log('❌ localStorage\'da TUserInfo bulunamadı')
      return { success: false, message: 'Kullanıcı bilgisi bulunamadı' }
    }
    
    let userInfo: TUserInfo
    try {
      userInfo = JSON.parse(storedUserInfo)
    } catch (parseError) {
      console.error('❌ TUserInfo parse hatası:', parseError)
      return { success: false, message: 'Kullanıcı bilgisi bozuk' }
    }
    
    if (!userInfo.accessToken) {
      console.log('❌ TUserInfo\'da accessToken bulunamadı')
      return { success: false, message: 'Access token bulunamadı' }
    }
    
    console.log('🚀 TUserInfo bulundu, auto login API çağrısı yapılıyor...', {
      userId: userInfo.id,
      userName: userInfo.name,
      accessToken: userInfo.accessToken.substring(0, 20) + '...'
    })
    
    // Safari'de network timeout sorunları için retry mekanizması
    let response
    let retryCount = 0
    const maxRetries = 2
    
    while (retryCount <= maxRetries) {
      try {
        // Auto login API çağrısı yap
        response = await kerzzAPI.post(KERZZ_SSO.ENDPOINTS.AUTO_LOGIN, {
          token: userInfo.accessToken
        })
        break // Başarılı olursa döngüden çık
      } catch (networkError) {
        retryCount++
        console.warn(`⚠️ Network hatası (deneme ${retryCount}/${maxRetries + 1}):`, networkError)
        
        if (retryCount > maxRetries) {
          throw networkError
        }
        
        // Safari'de kısa bir bekleme süresi
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }
    }
    
    console.log('📨 Auto login API response:', response?.data)

    // API'den gelen response'u kontrol et (response.data direkt TUserInfo)
    if (response?.data && response.data.accessToken) {
      // response.data direkt TUserInfo tipinde
      const updatedUserInfo: TUserInfo = response.data

      // Safari uyumlu token saklama
      try {
        await storage.setItem(STORAGE_KEYS.KERZZ_TOKEN, updatedUserInfo.accessToken)
      } catch (error) {
        console.warn('⚠️ sessionStorage token yazma hatası:', error)
      }
      
      const storageSuccess = await safeSetLocalStorage(STORAGE_KEYS.KERZZ_USER_INFO, JSON.stringify(updatedUserInfo))
      if (!storageSuccess) {
        console.warn('⚠️ UserInfo localStorage\'a yazılamadı, sadece sessionStorage kullanılacak')
      }

      console.log('✅ Auto login başarılı, güncellenmiş UserInfo alındı')
      
      return {
        success: true,
        userInfo: updatedUserInfo,
        token: updatedUserInfo.accessToken
      }
    } else {
      // API'den başarısız response geldi
      return { success: false, message: 'Auto login başarısız - UserInfo alınamadı' }
    }
  } catch (error) {
    console.error('❌ localStorage auto login hatası:', error)
    
    // Hatalı durumda localStorage'ı temizle (Safari uyumlu)
    try {
      await storage.removeItem(STORAGE_KEYS.KERZZ_USER_INFO)
    } catch (cleanupError) {
      console.warn('⚠️ localStorage temizleme hatası:', cleanupError)
    }
    
    await clearStoredToken()
    
    if (isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Auto login başarısız'
      return { success: false, message: errorMessage }
    }
    
    return { success: false, message: error instanceof Error ? error.message : 'Auto login başarısız' }
  }
}

/**
 * Kolaylık: Mevcut seçili lisans ile kullanıcıları getir
 */
export const getUsersWithCurrentLicance = async (): Promise<{ success: boolean; data?: APP_USER[]; message?: string; error?: string }> => {
  const storedAuthData = await storage.getItem('auth-storage')
  if (!storedAuthData) return { success: false, error: 'Kullanıcı oturumu bulunamadı' }
  try {
    const authData = JSON.parse(storedAuthData)
    const selectedLicance = authData?.state?.selectedLicance
    if (!selectedLicance?.licanceId) return { success: false, error: 'Seçili lisans bulunamadı' }
    return await getUsers(selectedLicance.licanceId)
  } catch {
    return { success: false, error: 'Auth verisi okunamadı' }
  }
}

/**
 * SMS OTP kodu isteme
 * @param gsm - Kullanıcının telefon numarası
 * @returns Promise<KerzzOtpResponse>
 */
export const requestOtpSms = async (gsm: string): Promise<KerzzOtpResponse> => {
  try {
    console.log('🔧 Kerzz SSO requestOtpSms fonksiyonu çağrıldı:', gsm)
    
    const response = await kerzzAPI.post(KERZZ_SSO.ENDPOINTS.REQUEST_OTP_SMS, {
      gsm
    })

    console.log('📨 OTP request API response:', response.data)

    if (response.data) {
      return {
        success: true,
        message: response.data.message || 'OTP kodu gönderildi'
      }
    }

    return {
      success: false,
      message: 'OTP kodu gönderilemedi'
    }
  } catch (error) {
    console.error('Kerzz requestOtpSms hatası:', error)
    
    if (isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'OTP kodu gönderilemedi'
      return {
        success: false,
        error: errorMessage
      }
    }
    
    return {
      success: false,
      error: 'Ağ hatası: Sunucuya bağlanılamadı'
    }
  }
}

/**
 * SMS OTP kodu doğrulama ve giriş
 * @param gsm - Kullanıcının telefon numarası
 * @param otpCode - OTP doğrulama kodu
 * @returns Promise<KerzzLoginResponse>
 */
export const verifyOtpSms = async (gsm: string, otpCode: string): Promise<KerzzLoginResponse> => {
  try {
    console.log('🔧 Kerzz SSO verifyOtpSms fonksiyonu çağrıldı:', { gsm, otpCode })
    
    const response = await kerzzAPI.post(KERZZ_SSO.ENDPOINTS.VERIFY_OTP_SMS, {
      gsm,
      otpCode
    })

    console.log('📨 OTP verify API response:', response.data)

    // API direkt kullanıcı bilgilerini döndürüyor (accessToken ile birlikte)
    if (response.data && response.data.accessToken) {
      // response.data direkt TUserInfo tipinde
      const userInfo: TUserInfo = response.data

      // AccessToken'ı token olarak sakla ve TUserInfo'yu storage'a kaydet
      await storage.setItem(STORAGE_KEYS.KERZZ_TOKEN, userInfo.accessToken)
      await storage.setItem(STORAGE_KEYS.KERZZ_USER_INFO, JSON.stringify(userInfo))
      await storage.removeItem('rememberMe')

      console.log('✅ OTP doğrulama başarılı, kullanıcı bilgileri direkt alındı')
      console.log('💾 TUserInfo localStorage\'a kaydedildi')
      console.log('📋 Kullanıcı bilgileri:', {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.mail,
        licancesCount: userInfo.licances?.length || 0
      })
      
      return {
        success: true,
        token: userInfo.accessToken,
        userInfo: userInfo
      }
    }

    // AccessToken yoksa hata
    return {
      success: false,
      message: 'OTP doğrulama başarısız - kullanıcı bilgileri alınamadı'
    }
  } catch (error) {
    console.error('Kerzz verifyOtpSms hatası:', error)
    
    if (isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'OTP doğrulama başarısız'
      return {
        success: false,
        error: errorMessage
      }
    }
    
    return {
      success: false,
      error: 'Ağ hatası: Sunucuya bağlanılamadı'
    }
  }
}
