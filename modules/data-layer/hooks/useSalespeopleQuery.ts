import { useCallback, useMemo } from 'react';
import { TCombinedUser, TSalesperson, TUser, TUserApp, TUserProfile } from '../../../types/dto';
import { useAuthStore } from '../../auth';
import { useHttpClient } from '../services';
import { useBaseQuery } from './useBaseQuery';

export interface UseSalespeopleQueryResult {
  salespeople: TSalesperson[];
  allUsers: TCombinedUser[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getSalespersonById: (id: string) => TSalesperson | undefined;
  isSalesperson: (userId: string) => boolean;
}

/**
 * Satışçıları ve tüm kullanıcıları getiren hook
 */
export function useSalespeopleQuery(appId: string = '1e4c-84b8'): UseSalespeopleQueryResult {
  const authStore = useAuthStore();
  const httpClient = useHttpClient();
  
  // Departman ID'si satışçı departmanı için
  const SALES_DEPARTMENT_ID = 'ee08-7077';

  // User-apps için base query
  const userAppsQuery = useBaseQuery<TUserApp>(
    {
      database: 'sso-db',
      collection: 'user-apps',
      httpClient,
      authStore,
    },
    ['user-apps']
  );

  // Users için base query
  const usersQuery = useBaseQuery<TUser>(
    {
      database: 'sso-db',
      collection: 'users',
      httpClient,
      authStore,
    },
    ['users']
  );

  // User-profiles için base query
  const userProfilesQuery = useBaseQuery<TUserProfile>(
    {
      database: 'kerzz-contract',
      collection: 'user-profiles',
      httpClient,
      authStore,
    },
    ['user-profiles']
  );

  // User-apps verilerini çek
  const userAppsResult = userAppsQuery.useList({
    filter: { app_id: appId }
  });

  // User ID'lerini çıkar
  const userIds = useMemo(() => {
    return userAppsResult.data?.map(ua => ua.user_id) || [];
  }, [userAppsResult.data]);

  // Users verilerini çek
  const usersResult = usersQuery.useList({
    filter: { id: { $in: userIds } }
  }, {
    enabled: userIds.length > 0
  });

  // User-profiles verilerini çek
  const userProfilesResult = userProfilesQuery.useList({
    filter: { userId: { $in: userIds } }
  }, {
    enabled: userIds.length > 0
  });

  // Verileri birleştir
  const { allUsers, salespeople } = useMemo(() => {
    if (!userAppsResult.data || !usersResult.data) {
      return { allUsers: [], salespeople: [] };
    }

    const combinedUsers: TCombinedUser[] = [];
    const salespeople: TSalesperson[] = [];

    // User-apps'deki her kullanıcı için
    userAppsResult.data.forEach(userApp => {
      // İlgili user bilgisini bul
      const user = usersResult.data?.find(u => u.id === userApp.user_id);
      if (!user) return;

      // İlgili user profile bilgisini bul
      const userProfile = userProfilesResult.data?.find(up => up.userId === userApp.user_id);

      // Birleştirilmiş kullanıcı objesi oluştur
      const combinedUser: TCombinedUser = {
        id: user.id,
        name: user.name,
        phone: user.phone,
        mail: user.mail,
        userLanguage: user.userLanguage,
        userRegion: user.userRegion,
        lastLoginDate: user.lastLoginDate,
        lastActionDate: user.lastActionDate,
        // User profile bilgileri varsa ekle
        ...(userProfile && {
          departmentId: userProfile.departmentId,
          status: userProfile.status,
          profilePhotoUrl: userProfile.profilePhotoUrl,
          biography: userProfile.biography,
          companyCode: userProfile.companyCode,
          startDate: userProfile.startDate,
          endDate: userProfile.endDate
        })
      };

      combinedUsers.push(combinedUser);

      // Eğer satış departmanındaysa satışçı listesine ekle
      if (userProfile?.departmentId === SALES_DEPARTMENT_ID) {
        salespeople.push({
          ...combinedUser,
          departmentId: userProfile.departmentId
        } as TSalesperson);
      }
    });

    return { allUsers: combinedUsers, salespeople };
  }, [userAppsResult.data, usersResult.data, userProfilesResult.data, SALES_DEPARTMENT_ID]);

  const loading = userAppsResult.isLoading || usersResult.isLoading || userProfilesResult.isLoading;
  const error = userAppsResult.error?.message || usersResult.error?.message || userProfilesResult.error?.message || null;

  const refetch = useCallback(async () => {
    await Promise.all([
      userAppsResult.refetch(),
      usersResult.refetch(),
      userProfilesResult.refetch()
    ]);
  }, [userAppsResult, usersResult, userProfilesResult]);

  const getSalespersonById = useCallback((id: string): TSalesperson | undefined => {
    return salespeople.find(sp => sp.id === id);
  }, [salespeople]);

  const isSalesperson = useCallback((userId: string): boolean => {
    return salespeople.some(sp => sp.id === userId);
  }, [salespeople]);

  return {
    salespeople,
    allUsers,
    loading,
    error,
    refetch,
    getSalespersonById,
    isSalesperson
  };
}

/**
 * Sadece satışçıları getiren basit hook
 */
export function useSalespeople(appId?: string) {
  const { salespeople, loading, error, refetch } = useSalespeopleQuery(appId);

  return {
    salespeople,
    loading,
    error,
    refetch
  };
}

/**
 * Belirli bir kullanıcının satışçı olup olmadığını kontrol eden hook
 */
export function useIsSalesperson(userId: string, appId?: string) {
  const { isSalesperson: checkIsSalesperson, loading, error, refetch } = useSalespeopleQuery(appId);

  const isSalesperson = useMemo(() => {
    return userId ? checkIsSalesperson(userId) : false;
  }, [userId, checkIsSalesperson]);

  return {
    isSalesperson,
    loading,
    error,
    refetch
  };
}
