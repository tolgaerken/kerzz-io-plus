import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { licenseManager } from '../../../utils/licenseStorage';
import { autoLoginFromStorage, logout as kerzzLogout, requestOtpSms, verifyOtpSms } from '../services/kerzz-sso';
import { AuthState, LoginCredentials } from '../types/auth';

// Auth state tiplerini genişletelim
interface AuthStateExtended extends AuthState {
  // Loading states
  isLoading: boolean;
  isInitializing: boolean;
  isSendingOTP: boolean;
  isVerifyingOTP: boolean;
  isLoggingIn: boolean;
  
  // Error states
  error: string | null;
  otpError: string | null;
  loginError: string | null;
  
  // OTP workflow states
  tempEmailOrPhone: string | null;
  otpSent: boolean;
  step: 'phone' | 'otp' | 'completed';
  
  // Auth workflow
  hasUser: boolean;
  hasUserInfo: boolean;
  persistedData: any;
}

interface AuthStore extends AuthStateExtended {
  // Actions
  sendOTP: (emailOrPhone: string) => Promise<boolean>;
  verifyOTP: (code: string) => Promise<boolean>;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  clearErrors: () => void;
  resetOTPFlow: () => void;
  setFirstLogin: (value: boolean) => void;
  initializeAuth: () => Promise<boolean>;
  setSelectedLicense: (license: any) => Promise<void>;
  completeLogin: (userInfo: any) => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isFirstLogin: false,
      restaurant: undefined,
      userInfo: undefined,
      selectedLicense: undefined,
      
      // Loading states
      isLoading: false,
      isInitializing: true,
      isSendingOTP: false,
      isVerifyingOTP: false,
      isLoggingIn: false,
      
      // Error states
      error: null,
      otpError: null,
      loginError: null,
      
      // OTP workflow states
      tempEmailOrPhone: null,
      otpSent: false,
      step: 'phone',
      
      // Auth workflow
      hasUser: false,
      hasUserInfo: false,
      persistedData: null,

      // Clear all errors
      clearErrors: () => {
        set({
          error: null,
          otpError: null,
          loginError: null
        });
      },

      // Reset OTP flow
      resetOTPFlow: () => {
        set({
          step: 'phone',
          otpSent: false,
          tempEmailOrPhone: null,
          otpError: null,
          error: null
        });
      },

      // Send OTP
      sendOTP: async (emailOrPhone: string) => {
        // Clear previous errors
        set({ 
          isSendingOTP: true, 
          otpError: null, 
          error: null 
        });

        try {
          console.log('📱 OTP gönderimi başlatılıyor:', emailOrPhone);
          
          const response = await requestOtpSms(emailOrPhone);
          
          if (response.success) {
            set({ 
              tempEmailOrPhone: emailOrPhone,
              otpSent: true,
              step: 'otp',
              isSendingOTP: false
            });
            
            console.log('✅ OTP başarıyla gönderildi');
            return true;
          } else {
            const errorMessage = response.error || response.message || 'OTP gönderilirken hata oluştu';
            set({ 
              otpError: errorMessage,
              isSendingOTP: false
            });
            
            console.error('❌ OTP gönderimi başarısız:', errorMessage);
            return false;
          }
        } catch (error: any) {
          const errorMessage = error?.message || 'Beklenmeyen bir hata oluştu';
          set({ 
            otpError: errorMessage,
            isSendingOTP: false
          });
          
          console.error('❌ OTP gönderimi hatası:', error);
          return false;
        }
      },

      // Verify OTP
      verifyOTP: async (code: string) => {
        const state = get();
        const gsm = state.tempEmailOrPhone;
        
        if (!gsm) {
          set({ otpError: 'Telefon numarası bulunamadı' });
          return false;
        }
        
        set({ 
          isVerifyingOTP: true, 
          otpError: null,
          error: null
        });

        try {
          console.log('🔐 OTP doğrulama başlatılıyor:', { gsm, code });
          
          const response = await verifyOtpSms(gsm, code);
          
          if (response.success && response.userInfo) {
            console.log('✅ OTP doğrulama başarılı');
            
            // Login işlemini tamamla
            await get().completeLogin(response.userInfo);
            
            set({ 
              isVerifyingOTP: false,
              step: 'completed'
            });
            
            return true;
          } else {
            const errorMessage = response.error || response.message || 'OTP kodu geçersiz';
            set({ 
              otpError: errorMessage,
              isVerifyingOTP: false
            });
            
            console.error('❌ OTP doğrulama başarısız:', errorMessage);
            return false;
          }
        } catch (error: any) {
          const errorMessage = error?.message || 'OTP doğrulanırken hata oluştu';
          set({ 
            otpError: errorMessage,
            isVerifyingOTP: false
          });
          
          console.error('❌ OTP doğrulama hatası:', error);
          return false;
        }
      },

      // Complete login (internal helper)
      completeLogin: async (userInfo: any) => {
        try {
          console.log('✅ Giriş başarılı, kullanıcı bilgileri set ediliyor');
          
          // Kullanıcı bilgilerini mevcut User tipine dönüştür
          const user = {
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.mail,
            phone: userInfo.phone,
            role: 'admin' as const,
            createdAt: new Date()
          };

          // License manager'dan mevcut lisansı kontrol et
          let selectedLicense = await licenseManager.getCurrentLicense();

          // Eğer localStorage'dan lisans okuduysa ve kullanıcının lisansları arasında varsa, geçerli
          if (selectedLicense && userInfo.licances) {
            const isLicenseValid = userInfo.licances.some((lic: any) => lic.licanceId === selectedLicense?.licanceId);
            if (!isLicenseValid) {
              console.log('⚠️ Mevcut lisans kullanıcının lisansları arasında bulunamadı, temizleniyor');
              await licenseManager.clearCurrentLicense();
              selectedLicense = null;
            } else {
              console.log('✅ Mevcut lisans geçerli, devam ediliyor:', selectedLicense.licanceId);
            }
          }

          // İlk giriş kontrolü - lisans seçimi gerekli mi
          const isFirstLogin = !selectedLicense && (!userInfo.licances || userInfo.licances.length === 0);
          const needsLicenseSelection = !selectedLicense && userInfo.licances && userInfo.licances.length > 0;

          console.log('📋 Kullanıcı lisans bilgileri:', {
            totalLicances: userInfo.licances?.length || 0,
            selectedLicense: selectedLicense?.licanceId || 'Yok',
            isFirstLogin,
            needsLicenseSelection
          });

          set({
            user,
            isAuthenticated: true,
            isFirstLogin,
            restaurant: undefined,
            userInfo,
            selectedLicense,
            hasUser: true,
            hasUserInfo: true,
            tempEmailOrPhone: null,
            otpSent: false,
            error: null,
            otpError: null,
            loginError: null,
            persistedData: {
              user,
              userInfo,
              selectedLicense,
              isFirstLogin
            }
          });

          return true;
        } catch (error: any) {
          console.error('❌ Login tamamlama hatası:', error);
          set({
            loginError: error?.message || 'Giriş işlemi tamamlanırken hata oluştu'
          });
          return false;
        }
      },

      // Login (for compatibility)
      login: async (credentials: LoginCredentials) => {
        const state = get();
        const gsm = state.tempEmailOrPhone || credentials.emailOrPhone;
        
        if (!gsm || !credentials.otpCode) {
          set({ loginError: 'Telefon numarası veya OTP kodu eksik' });
          return false;
        }
        
        set({ 
          isLoggingIn: true,
          loginError: null,
          error: null
        });

        try {
          console.log('🚀 Giriş işlemi başlatılıyor:', { gsm, otpCode: credentials.otpCode });
          
          const response = await verifyOtpSms(gsm, credentials.otpCode);
          
          if (response.success && response.userInfo) {
            await get().completeLogin(response.userInfo);
            
            set({ isLoggingIn: false });
            return true;
          } else {
            const errorMessage = response.error || response.message || 'E-posta adresi veya şifre hatalı';
            set({ 
              loginError: errorMessage,
              isLoggingIn: false
            });
            
            console.error('❌ Giriş başarısız:', errorMessage);
            return false;
          }
        } catch (error: any) {
          const errorMessage = error?.message || 'Giriş işlemi sırasında hata oluştu';
          set({ 
            loginError: errorMessage,
            isLoggingIn: false
          });
          
          console.error('❌ Giriş hatası:', error);
          return false;
        }
      },

      // Logout
      logout: async () => {
        try {
          // Kerzz SSO token'ını temizle
          await kerzzLogout();
          console.log('🚪 Kullanıcı çıkış yapıyor');
        } catch (error) {
          console.error('❌ Logout hatası:', error);
        }

        try {
          // License manager'ı temizle
          await licenseManager.reset();
          console.log('🗑️ License manager sıfırlandı');
        } catch (error) {
          console.error('❌ License manager temizleme hatası:', error);
        }

        // State'i temizle
        set({
          user: null,
          isAuthenticated: false,
          isFirstLogin: false,
          restaurant: undefined,
          userInfo: undefined,
          selectedLicense: undefined,
          hasUser: false,
          hasUserInfo: false,
          persistedData: null,
          
          // Loading states
          isLoading: false,
          isSendingOTP: false,
          isVerifyingOTP: false,
          isLoggingIn: false,
          
          // Error states
          error: null,
          otpError: null,
          loginError: null,
          
          // OTP workflow states
          tempEmailOrPhone: null,
          otpSent: false,
          step: 'phone'
        });
      },

      // Set first login
      setFirstLogin: (value: boolean) => {
        set({ 
          isFirstLogin: value,
          restaurant: value ? undefined : get().restaurant
        });
      },

      // Initialize auth
      initializeAuth: async () => {
        set({ isInitializing: true, error: null });
        
        try {
          console.log('🚀 Auth store başlatılıyor, localStorage kontrolü...');
          
          const response = await autoLoginFromStorage();
          
          if (response.success && response.userInfo) {
            await get().completeLogin(response.userInfo);
            
            set({ isInitializing: false });
            console.log('✅ Auto login başarılı');
            return true;
          } else {
            console.log('ℹ️ Auto login başarısız, kullanıcı login sayfasına yönlendirilecek');
            set({ 
              isInitializing: false,
              isAuthenticated: false,
              hasUser: false,
              hasUserInfo: false
            });
            return false;
          }
        } catch (error: any) {
          console.log('❌ Auto login hatası:', error);
          
          set({
            isInitializing: false,
            isAuthenticated: false,
            hasUser: false,
            hasUserInfo: false,
            error: error?.message || 'Başlatma sırasında hata oluştu',
            user: null,
            userInfo: undefined,
            selectedLicense: undefined,
            persistedData: null
          });
          
          return false;
        }
      },

      // Set selected license
      setSelectedLicense: async (license: any) => {
        try {
          // License manager'a da kaydet
          if (license) {
            await licenseManager.setCurrentLicense(license);
          } else {
            await licenseManager.clearCurrentLicense();
          }

          set({
            selectedLicense: license,
            persistedData: {
              ...get().persistedData,
              selectedLicense: license
            }
          });
        } catch (error) {
          console.error('❌ setSelectedLicense hatası:', error);
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        persistedData: state.persistedData,
        selectedLicense: state.selectedLicense
      })
    }
  )
);