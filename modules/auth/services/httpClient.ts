import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_HEADERS } from '../constants';
import { getStoredTokenSync } from './kerzz-sso';

// MongoDB API Configuration
const MONGO_API = {
  BASE_URL: process.env.EXPO_PUBLIC_DB_URL || 'https://public.kerzz.com:50502/api/database/dataAction',
  TIMEOUT: 30000,
} as const

// E-Document API Constants (subset needed for httpClient)
const EDOCUMENT_API = {
  API_KEY: process.env.EXPO_PUBLIC_KERZZ_API_KEY || 'MzR5cjgyMsSxdXJmZmcyamdydWZncmV1amRmbmJodWQ',
} as const

/**
 * HTTP Client Service - Angular THttpService'den React'e uyarlandı
 * Axios tabanlı HTTP client service
 */
export class HttpClientService {
  private static instance: HttpClientService;
  private axiosInstance: AxiosInstance;
  private loadingCallback?: (progress: number) => void;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: MONGO_API.BASE_URL,
      timeout: MONGO_API.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor - token ekleme
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = getStoredTokenSync();
        if (token) {
          config.headers = config.headers || {};
          config.headers['authorization'] = token;
        }

        // MongoDB API çağrıları için özel header'lar ekle
        // Base URL kullandığımız için relative URL kontrolü yapıyoruz
        if (config.url && (config.url.includes('/api/database/dataAction') || !config.url.startsWith('http'))) {
          config.headers = config.headers || {};
          
          // x-api-key header'ı ekle (EDOCUMENT_API'den)
          config.headers[API_HEADERS.API_KEY] = EDOCUMENT_API.API_KEY;
          
          // x-user-token header'ı ekle (userInfo'dan accessToken)
          try {
            const storedAuthData = await AsyncStorage.getItem('auth-storage');
            if (storedAuthData) {
              const authData = JSON.parse(storedAuthData);
              const accessToken = authData?.state?.persistedData?.userInfo?.accessToken;
              if (accessToken) {
                config.headers[API_HEADERS.USER_TOKEN] = accessToken;
              }
            }
          } catch (error) {
            console.warn('MongoDB header ekleme hatası:', error);
          }
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Network error detaylı loglama
        if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
          console.error('🌐 Network bağlantı hatası:', {
            message: error.message,
            config: {
              url: error.config?.url,
              baseURL: error.config?.baseURL,
              method: error.config?.method,
              timeout: error.config?.timeout
            }
          });
        } else {
          console.error('HTTP Error:', error);
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): HttpClientService {
    if (!HttpClientService.instance) {
      HttpClientService.instance = new HttpClientService();
    }
    return HttpClientService.instance;
  }

  /**
   * Loading progress callback'i ayarla
   */
  public setLoadingCallback(callback: (progress: number) => void): void {
    this.loadingCallback = callback;
  }

  /**
   * GET isteği
   */
  public async get<T>(
    url: string, 
    params?: Record<string, string | number | boolean | string[] | number[] | boolean[]>, 
    trackLoading: boolean = true
  ): Promise<T> {
    try {
      if (trackLoading && this.loadingCallback) {
        this.loadingCallback(0);
      }

      const config: AxiosRequestConfig = {};
      if (params) {
        config.params = params;
      }

      const response: AxiosResponse<T> = await this.axiosInstance.get(url, config);
      
      if (trackLoading && this.loadingCallback) {
        this.loadingCallback(-1);
      }

      return response.data;
    } catch (error) {
      if (trackLoading && this.loadingCallback) {
        this.loadingCallback(-1);
      }
      throw error;
    }
  }

  /**
   * POST isteği
   */
  public async post<T, U = unknown>(
    url: string,
    body: U,
    headers?: Record<string, string>,
    trackLoading: boolean = true
  ): Promise<T> {
    try {
      if (trackLoading && this.loadingCallback) {
        this.loadingCallback(0);
      }

      const config: AxiosRequestConfig = {
        onUploadProgress: (progressEvent) => {
          if (trackLoading && this.loadingCallback && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            this.loadingCallback(progress);
          }
        },
        onDownloadProgress: (progressEvent) => {
          if (trackLoading && this.loadingCallback && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            this.loadingCallback(progress);
          }
        }
      };

      if (headers) {
        config.headers = { ...config.headers, ...headers };
      }

      const response: AxiosResponse<T> = await this.axiosInstance.post(url, body, config);
      
      if (trackLoading && this.loadingCallback) {
        setTimeout(() => this.loadingCallback!(-1), 500);
      }

      return response.data;
    } catch (error) {
      if (trackLoading && this.loadingCallback) {
        this.loadingCallback(-1);
      }
      throw error;
    }
  }

  /**
   * PUT isteği
   */
  public async put<T, U = unknown>(
    url: string,
    body: U,
    headers?: Record<string, string>,
    trackLoading: boolean = true
  ): Promise<T> {
    try {
      if (trackLoading && this.loadingCallback) {
        this.loadingCallback(0);
      }

      const config: AxiosRequestConfig = {};
      if (headers) {
        config.headers = headers;
      }

      const response: AxiosResponse<T> = await this.axiosInstance.put(url, body, config);
      
      if (trackLoading && this.loadingCallback) {
        this.loadingCallback(-1);
      }

      return response.data;
    } catch (error) {
      if (trackLoading && this.loadingCallback) {
        this.loadingCallback(-1);
      }
      throw error;
    }
  }

  /**
   * DELETE isteği
   */
  public async delete<T>(
    url: string,
    headers?: Record<string, string>,
    trackLoading: boolean = true
  ): Promise<T> {
    try {
      if (trackLoading && this.loadingCallback) {
        this.loadingCallback(0);
      }

      const config: AxiosRequestConfig = {};
      if (headers) {
        config.headers = headers;
      }

      const response: AxiosResponse<T> = await this.axiosInstance.delete(url, config);
      
      if (trackLoading && this.loadingCallback) {
        this.loadingCallback(-1);
      }

      return response.data;
    } catch (error) {
      if (trackLoading && this.loadingCallback) {
        this.loadingCallback(-1);
      }
      throw error;
    }
  }
}

// Singleton instance export
export const httpClient = HttpClientService.getInstance();
