import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useAuthStore } from '../../auth';
import { useHttpClient } from '../services';
import { CreateMessageInput, Message, MessageFilters } from '../types/messages';
import { useBaseQuery } from './useBaseQuery';

/**
 * Mesaj verilerini yönetmek için özel hook
 * kerzz-contract veritabanındaki messages koleksiyonunu kullanır
 */
export function useMessagesQuery() {
  const authStore = useAuthStore();
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();

  // Base query hook'unu kerzz-contract.messages için yapılandır
  const baseQuery = useBaseQuery<Message>(
    {
      database: 'kerzz-contract',
      collection: 'messages',
      httpClient,
      authStore,
    },
    ['messages'] // Query key base
  );

  // Filtreye göre mesajları getiren hook
  const useMessagesByFilter = (filters: MessageFilters = {}) => {
    const filter = useMemo(() => {
      const mongoFilter: any = {};

      if (filters.type) {
        mongoFilter.type = filters.type;
      }

      if (filters.priority) {
        mongoFilter.priority = filters.priority;
      }

      if (filters.importance) {
        mongoFilter.importance = filters.importance;
      }

      if (filters.senderId) {
        mongoFilter.senderId = filters.senderId;
      }

      if (filters.unreadOnly) {
        // Mevcut kullanıcı için okunmamış mesajlar
        const currentUserId = authStore.userInfo?.id;
        if (currentUserId) {
          mongoFilter[`isRead.${currentUserId}`] = { $ne: true };
        }
      }

      if (filters.mentionsMe) {
        // Kullanıcıyı mention eden mesajlar
        const currentUserId = authStore.userInfo?.id;
        if (currentUserId) {
          mongoFilter['mentions.users.id'] = currentUserId;
        }
      }

      if (filters.dateFrom || filters.dateTo) {
        mongoFilter.createdAt = {};
        if (filters.dateFrom) {
          mongoFilter.createdAt.$gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          mongoFilter.createdAt.$lte = filters.dateTo;
        }
      }

      if (filters.searchText) {
        mongoFilter.$or = [
          { content: { $regex: filters.searchText, $options: 'i' } },
          { senderName: { $regex: filters.searchText, $options: 'i' } }
        ];
      }

      return mongoFilter;
    }, [filters]);

    return baseQuery.useList(
      { 
        filter,
        sort: { createdAt: -1 } // En yeni mesajlar önce
      }
    );
  };

  // Mesaj oluşturma mutation'ı
  const useCreateMessage = () => {
    return useMutation({
      mutationFn: async (messageInput: CreateMessageInput): Promise<Message> => {
        const currentUser = authStore.userInfo;
        if (!currentUser) {
          throw new Error('Kullanıcı bilgisi bulunamadı');
        }

        // Message objesini oluştur
        const messageData: Omit<Message, 'id' | 'createdAt' | 'updatedAt'> = {
          content: messageInput.content,
          senderId: currentUser.id || '',
          senderName: currentUser.name || 'Bilinmeyen Kullanıcı',
          senderEmail: currentUser.email || '',
          senderImage: currentUser.image,
          type: messageInput.type,
          targetUsers: messageInput.targetUsers,
          targetDepartments: messageInput.targetDepartments,
          priority: messageInput.priority || 'medium',
          importance: messageInput.importance || 'normal',
          hasSound: messageInput.hasSound || false,
          mentions: {
            users: messageInput.mentions?.users || [],
            departments: messageInput.mentions?.departments || [],
            customers: messageInput.mentions?.customers || [],
            licenses: messageInput.mentions?.licenses || []
          },
          references: messageInput.references,
          isRead: {},
          readAt: {},
          licenseId: currentUser.licenseId || '', // Kullanıcının lisans ID'si
        };

        // Base query'nin createItem fonksiyonunu kullan
        return await baseQuery.createItem(messageData);
      },
      onSuccess: (newMessage) => {
        // Cache'i güncelle
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        console.log('✅ Mesaj başarıyla oluşturuldu:', {
          messageId: newMessage?.id,
          content: newMessage?.content,
          targetUsers: newMessage?.targetUsers
        });
      },
      onError: (error) => {
        console.error('❌ Mesaj oluşturma hatası:', error);
      },
    });
  };

  // Mesaj okundu olarak işaretleme mutation'ı
  const useMarkAsRead = () => {
    return useMutation({
      mutationFn: async ({ messageId, userId }: { messageId: string; userId: string }): Promise<Message> => {
        const updateData = {
          [`isRead.${userId}`]: true,
          [`readAt.${userId}`]: new Date(),
        };

        return await baseQuery.updateItem(messageId, updateData);
      },
      onSuccess: (updatedMessage) => {
        // Cache'i güncelle
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        console.log('✅ Mesaj okundu olarak işaretlendi:', updatedMessage.id);
      },
      onError: (error) => {
        console.error('❌ Mesaj okundu işaretleme hatası:', error);
      },
    });
  };

  // Satış onayı için mesaj input'u oluşturma fonksiyonu
  const createSaleApprovalMessageInput = useCallback((
    fromUserId: string,
    saleData: any
  ): CreateMessageInput => {
    const messageContent = `Satış onaylandı: ${saleData.no || saleData.id} - ${saleData.company || 'Bilinmeyen Şirket'}`;

    return {
      content: messageContent,
      type: 'private',
      targetUsers: [fromUserId],
      priority: 'high',
      importance: 'important',
      hasSound: true,
      references: [{
        type: 'record',
        collection: 'sales',
        recordId: saleData.id || saleData._id,
        displayText: `Satış: ${saleData.no}`,
        route: `/(drawer)/sale-detail?saleId=${saleData.id || saleData._id}`
      }]
    };
  }, []);

  return {
    // Query hooks
    useMessagesByFilter,

    // Mutation hooks
    useCreateMessage,
    useMarkAsRead,

    // Özel fonksiyonlar
    createSaleApprovalMessageInput,

    // Base query fonksiyonları
    ...baseQuery,
  };
}
