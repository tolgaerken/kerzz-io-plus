import { useAuthStore } from '@modules/auth';
import { useTheme } from '@modules/theme';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  // Auth store'dan reactive state'leri al
  const { 
    step, 
    isSendingOTP,
    isVerifyingOTP,
    isLoggingIn,
    otpError,
    loginError,
    error,
    sendOTP, 
    verifyOTP,
    clearErrors,
    resetOTPFlow
  } = useAuthStore();
  
  const { theme } = useTheme();

  // Component mount edildiğinde hataları temizle
  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  // Error state değişikliklerini göster
  useEffect(() => {
    if (error || otpError || loginError) {
      const errorMessage = error || otpError || loginError || '';
      Alert.alert('Hata', errorMessage);
    }
  }, [error, otpError, loginError]);

  const formatPhoneNumber = (phoneNumber: string): string => {
    // Telefon numarasını temizle (sadece rakamlar)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Eğer zaten +90 ile başlıyorsa olduğu gibi döndür
    if (phoneNumber.startsWith('+90')) {
      return phoneNumber;
    }
    
    // Eğer 90 ile başlıyorsa + ekle
    if (cleanPhone.startsWith('90')) {
      return '+' + cleanPhone;
    }
    
    // Eğer 0 ile başlıyorsa 0'ı kaldır ve +90 ekle
    if (cleanPhone.startsWith('0')) {
      return '+90' + cleanPhone.substring(1);
    }
    
    // Diğer durumlarda direkt +90 ekle
    return '+90' + cleanPhone;
  };

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      Alert.alert('Hata', 'Lütfen telefon numaranızı giriniz');
      return;
    }

    // Telefon numarası doğrulama
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert('Hata', 'Lütfen geçerli bir telefon numarası giriniz');
      return;
    }

    // Telefon numarasını formatla
    const formattedPhone = formatPhoneNumber(phone);
    console.log('📱 Formatlanmış telefon numarası:', formattedPhone);

    const success = await sendOTP(formattedPhone);
    if (success) {
      Alert.alert('Başarılı', 'OTP kodunuz gönderildi');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      Alert.alert('Hata', 'Lütfen OTP kodunu giriniz');
      return;
    }

    const success = await verifyOTP(otp);
    if (success) {
      Alert.alert('Başarılı', 'Giriş başarılı');
      router.replace('/');
    }
  };

  const handleBackToPhone = () => {
    resetOTPFlow();
    setOtp('');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.logoText}>K</Text>
            </View>
            <Text style={[styles.brandText, { color: theme.colors.text }]}>
              KERZZ REZERVASYON
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={[styles.content, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Hoş Geldiniz
          </Text>
          
          <Text style={[styles.subtitle, { color: theme.colors.textLight }]}>
            {step === 'phone' && 'Tek seferlik şifrenizi almak için lütfen telefon numaranızı giriniz.'}
            {step === 'otp' && 'Lütfen telefonunuza gelen OTP kodunu yazınız'}
            {step === 'completed' && 'Giriş işlemi tamamlandı'}
          </Text>

          {step === 'phone' && (
            <View style={styles.inputContainer}>
              <View style={[styles.phoneInputContainer, { borderColor: theme.colors.border }]}>
                <View style={styles.countryCode}>
                  <Text style={[styles.countryCodeText, { color: theme.colors.text }]}>
                    🇹🇷 +90
                  </Text>
                </View>
                <TextInput
                  style={[styles.phoneInput, { color: theme.colors.text }]}
                  placeholder="5xx xxx xx xx"
                  placeholderTextColor={theme.colors.textLight}
                  value={phone}
                  onChangeText={(text) => {
                    // Sadece rakam girmesine izin ver
                    const value = text.replace(/\D/g, '');
                    // Maksimum 10 haneli olsun (0xxx xxx xx xx formatında)
                    if (value.length <= 10) {
                      setPhone(value);
                    }
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              
              <TouchableOpacity
                style={[
                  styles.button, 
                  { backgroundColor: theme.colors.primary },
                  isSendingOTP && styles.buttonDisabled
                ]}
                onPress={handleSendOTP}
                disabled={isSendingOTP}
              >
                <Text style={styles.buttonText}>
                  {isSendingOTP ? 'GÖNDERİLİYOR...' : 'OTP GÖNDER'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'otp' && (
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.otpInput, 
                  { 
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text
                  }
                ]}
                placeholder="OTP kodunu giriniz"
                placeholderTextColor={theme.colors.textLight}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
              
              <TouchableOpacity
                style={[
                  styles.button, 
                  { backgroundColor: theme.colors.primary },
                  isVerifyingOTP && styles.buttonDisabled
                ]}
                onPress={handleVerifyOTP}
                disabled={isVerifyingOTP}
              >
                <Text style={styles.buttonText}>
                  {isVerifyingOTP ? 'DOĞRULANIYOR...' : 'DOĞRULA'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackToPhone}
              >
                <Text style={[styles.backButtonText, { color: theme.colors.textLight }]}>
                  ← Telefon numarası değiştir
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textLight }]}>
            Giriş yaparak{' '}
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>
              Kullanım Şartları
            </Text>
            {' '}ve{' '}
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>
              Gizlilik Politikası
            </Text>
            &apos;nı kabul etmiş olursunuz.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
  content: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    gap: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
  },
  otpInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
});

export default LoginPage;
