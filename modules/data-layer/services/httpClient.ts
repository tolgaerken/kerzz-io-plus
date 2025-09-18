import { httpClient, HttpClientService } from '../../auth/services/httpClient';

/**
 * Data layer için HTTP client hook'u
 * Auth modülündeki HttpClientService'i kullanır
 */
export function useHttpClient(): HttpClientService {
  return httpClient;
}

export { httpClient, HttpClientService };
