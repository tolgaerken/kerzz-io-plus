// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'staff';
  restaurantId?: string;
  createdAt: Date;
}

// Restaurant Types
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  createdAt: Date;
}

// Auth Types
export interface LoginCredentials {
  emailOrPhone: string;
  otpCode?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isFirstLogin: boolean;
  restaurant?: Restaurant;
  userInfo?: any; // Kerzz SSO TUserInfo
  selectedLicense?: any; // Seçili lisans bilgisi
}