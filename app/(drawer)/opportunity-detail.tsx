import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useAuthStore } from '../../modules/auth';
import { useOpportunitiesQuery } from '../../modules/data-layer/hooks/useOpportunitiesQuery';
import { useStyles } from '../../modules/theme';
import { TOpportunity, TOpportunityLog } from '../../types/dto';
import { getActiveSellers, getSellerById, TSeller } from '../../types/mockData';

export default function OpportunityDetailScreen() {
  const { opportunityData } = useLocalSearchParams<{ opportunityData: string }>();
  const { colors, spacing, fontSize } = useStyles();
  const { user } = useAuthStore();
  const opportunitiesQuery = useOpportunitiesQuery();

  // Parse opportunity data
  const opportunity: TOpportunity = opportunityData ? JSON.parse(opportunityData) : null;

  // States
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [newLogText, setNewLogText] = useState('');
  const [isAddingLog, setIsAddingLog] = useState(false);

  // Queries and mutations
  const { opportunity: detailOpportunity, logs, isLoading, error, refetch } = 
    opportunitiesQuery.useOpportunityWithLogs(opportunity?.id || '');
  
  const assignSellerMutation = opportunitiesQuery.useAssignSeller();
  const addLogMutation = opportunitiesQuery.useAddLog();
  const deleteLogMutation = opportunitiesQuery.useDeleteLog();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.small,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    backButton: {
      padding: spacing.small,
      marginRight: spacing.small,
    },
    title: {
      fontSize: fontSize.large,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
    },
    content: {
      flex: 1,
    },
    section: {
      backgroundColor: colors.background,
      marginVertical: spacing.small,
      padding: spacing.medium,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border + '30',
    },
    sectionTitle: {
      fontSize: fontSize.medium,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.medium,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.small,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '20',
    },
    infoLabel: {
      fontSize: fontSize.small,
      color: colors.textLight,
      fontWeight: '500',
      flex: 1,
    },
    infoValue: {
      fontSize: fontSize.small,
      color: colors.text,
      flex: 2,
      textAlign: 'right',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.small,
      borderRadius: 8,
      marginVertical: spacing.small,
    },
    actionButtonText: {
      color: 'white',
      fontSize: fontSize.medium,
      fontWeight: '600',
      marginLeft: spacing.small,
    },
    logItem: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border + '40',
      borderRadius: 8,
      padding: spacing.medium,
      marginVertical: spacing.small,
    },
    logHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.small,
    },
    logUser: {
      fontSize: fontSize.small,
      fontWeight: '600',
      color: colors.text,
    },
    logDate: {
      fontSize: fontSize.small,
      color: colors.textLight,
    },
    logText: {
      fontSize: fontSize.medium,
      color: colors.text,
      lineHeight: 20,
    },
    deleteLogButton: {
      padding: spacing.small,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.large,
      width: '90%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: fontSize.large,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.large,
    },
    sellerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.medium,
      paddingHorizontal: spacing.small,
      borderRadius: 8,
      marginVertical: 2,
    },
    selectedSeller: {
      backgroundColor: colors.primary + '20',
    },
    sellerAvatar: {
      fontSize: 24,
      marginRight: spacing.medium,
    },
    sellerInfo: {
      flex: 1,
    },
    sellerName: {
      fontSize: fontSize.medium,
      fontWeight: '600',
      color: colors.text,
    },
    sellerEmail: {
      fontSize: fontSize.small,
      color: colors.textLight,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border + '60',
      borderRadius: 8,
      padding: spacing.medium,
      fontSize: fontSize.medium,
      color: colors.text,
      minHeight: 100,
      textAlignVertical: 'top',
      marginBottom: spacing.medium,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.medium,
    },
    modalButton: {
      flex: 1,
      paddingVertical: spacing.medium,
      borderRadius: 8,
      marginHorizontal: spacing.small,
    },
    cancelButton: {
      backgroundColor: colors.border + '30',
    },
    confirmButton: {
      backgroundColor: colors.primary,
    },
    modalButtonText: {
      fontSize: fontSize.medium,
      fontWeight: '600',
      textAlign: 'center',
    },
    cancelButtonText: {
      color: colors.text,
    },
    confirmButtonText: {
      color: 'white',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xlarge,
    },
    errorText: {
      fontSize: fontSize.medium,
      color: colors.error,
      textAlign: 'center',
      marginTop: spacing.medium,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const handleBack = useCallback(() => {
    router.push('/(drawer)/opportunities');
  }, []);

  const handleAssignSeller = useCallback((seller: TSeller) => {
    if (!opportunity?.id) return;

    assignSellerMutation.mutate(
      {
        id: opportunity.id,
        data: {
          sellerId: seller.id,
        },
        sellerName: seller.name, // Satışçı adını log için gönder
        sellerToken: 'mock-token', // TODO: Gerçek FCM token'ı al
        opportunityData: {
          no: opportunity.no,
          company: opportunity.company,
          request: opportunity.request
        }
      },
      {
        onSuccess: () => {
          setShowSellerModal(false);
          refetch();
          Alert.alert('Başarılı', `${seller.name} satışçı olarak atandı ve durum 'Atandı' olarak güncellendi. Bildirimler gönderildi.`);
        },
        onError: (error: any) => {
          Alert.alert('Hata', 'Satışçı ataması yapılırken bir hata oluştu.');
          console.error('Satışçı atama hatası:', error);
        },
      }
    );
  }, [opportunity, assignSellerMutation, refetch]);

  const handleAddLog = useCallback(() => {
    if (!opportunity?.id || !newLogText.trim() || !user) return;

    setIsAddingLog(true);
    addLogMutation.mutate(
      {
        opportunityId: opportunity.id,
        logData: {
          text: newLogText.trim(),
          userId: user.id || 'current-user',
          userName: user.name || 'Mevcut Kullanıcı',
        }
      },
      {
        onSuccess: () => {
          setNewLogText('');
          setShowLogModal(false);
          setIsAddingLog(false);
          refetch();
          Alert.alert('Başarılı', 'Log başarıyla eklendi.');
        },
        onError: (error: any) => {
          setIsAddingLog(false);
          Alert.alert('Hata', 'Log eklenirken bir hata oluştu.');
          console.error('Log ekleme hatası:', error);
        },
      }
    );
  }, [opportunity, newLogText, user, addLogMutation, refetch]);

  const handleDeleteLog = useCallback((log: TOpportunityLog) => {
    Alert.alert(
      'Log Sil',
      'Bu log\'u silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            deleteLogMutation.mutate(log.id, {
              onSuccess: () => {
                refetch();
                Alert.alert('Başarılı', 'Log başarıyla silindi.');
              },
              onError: (error: any) => {
                Alert.alert('Hata', 'Log silinirken bir hata oluştu.');
                console.error('Log silme hatası:', error);
              },
            });
          },
        },
      ]
    );
  }, [deleteLogMutation, refetch]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getHeatColor = (heat: string) => {
    switch (heat?.toLowerCase()) {
      case 'hot': return '#EF4444';
      case 'warm': return '#F59E0B';
      case 'cold': return '#6B7280';
      default: return colors.textLight;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new': return '#3B82F6';
      case 'in-progress': return '#F59E0B';
      case 'won': return '#10B981';
      case 'lost': return '#EF4444';
      default: return colors.textLight;
    }
  };

  if (!opportunity) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            Fırsat verisi bulunamadı.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Fırsat Detayı</ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={{ marginTop: spacing.medium, color: colors.textLight }}>
            Fırsat detayları yükleniyor...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Fırsat Detayı</ThemedText>
        </View>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            Fırsat detayları yüklenirken bir hata oluştu.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const currentOpportunity = detailOpportunity || opportunity;
  const currentSeller = getSellerById(currentOpportunity.sellerId);
  const activeSellers = getActiveSellers();

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.title}>
          Fırsat #{currentOpportunity.no}
        </ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Temel Bilgiler */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Temel Bilgiler</ThemedText>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Şirket</ThemedText>
            <ThemedText style={styles.infoValue}>{currentOpportunity.company}</ThemedText>
          </View>

          {currentOpportunity.brand && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Marka</ThemedText>
              <ThemedText style={styles.infoValue}>{currentOpportunity.brand}</ThemedText>
            </View>
          )}

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Tarih</ThemedText>
            <ThemedText style={styles.infoValue}>{formatDate(currentOpportunity.date)}</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Durum</ThemedText>
            <ThemedText style={[styles.infoValue, { color: getStatusColor(currentOpportunity.status) }]}>
              {currentOpportunity.status}
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Sıcaklık</ThemedText>
            <ThemedText style={[styles.infoValue, { color: getHeatColor(currentOpportunity.heat) }]}>
              {currentOpportunity.heat}
            </ThemedText>
          </View>

          {currentOpportunity.type && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Tip</ThemedText>
              <ThemedText style={styles.infoValue}>{currentOpportunity.type}</ThemedText>
            </View>
          )}
        </View>

        {/* İletişim Bilgileri */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>İletişim Bilgileri</ThemedText>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>İsim</ThemedText>
            <ThemedText style={styles.infoValue}>{currentOpportunity.name}</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>E-posta</ThemedText>
            <ThemedText style={styles.infoValue}>{currentOpportunity.email}</ThemedText>
          </View>

          {currentOpportunity.phone && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Telefon</ThemedText>
              <ThemedText style={styles.infoValue}>{currentOpportunity.phone}</ThemedText>
            </View>
          )}

          {currentOpportunity.city && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Şehir</ThemedText>
              <ThemedText style={styles.infoValue}>
                {currentOpportunity.city} {currentOpportunity.town && `/ ${currentOpportunity.town}`}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Satışçı Bilgisi */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Satışçı</ThemedText>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Atanan Satışçı</ThemedText>
            <ThemedText style={styles.infoValue}>
              {currentSeller ? currentSeller.name : 'Atanmamış'}
            </ThemedText>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowSellerModal(true)}
          >
            <MaterialIcons name="person-add" size={20} color="white" />
            <ThemedText style={styles.actionButtonText}>
              {currentSeller ? 'Satışçı Değiştir' : 'Satışçı Ata'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Açıklama ve Detaylar */}
        {currentOpportunity.description && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Açıklama</ThemedText>
            <ThemedText style={[styles.infoValue, { textAlign: 'left' }]}>
              {currentOpportunity.description}
            </ThemedText>
          </View>
        )}

        {/* Loglar */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.medium }}>
            <ThemedText style={styles.sectionTitle}>Loglar ({logs.length})</ThemedText>
            <TouchableOpacity
              style={[styles.actionButton, { marginVertical: 0 }]}
              onPress={() => setShowLogModal(true)}
            >
              <MaterialIcons name="add" size={20} color="white" />
              <ThemedText style={styles.actionButtonText}>Log Ekle</ThemedText>
            </TouchableOpacity>
          </View>

          {logs.length === 0 ? (
            <ThemedText style={[styles.infoValue, { textAlign: 'center', color: colors.textLight }]}>
              Henüz log bulunmuyor
            </ThemedText>
          ) : (
            logs.map((log, index) => (
              <View key={`${log.id}-${index}`} style={styles.logItem}>
                <View style={styles.logHeader}>
                  <View>
                    <ThemedText style={styles.logUser}>{log.userName}</ThemedText>
                    <ThemedText style={styles.logDate}>{formatDate(log.date)}</ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteLogButton}
                    onPress={() => handleDeleteLog(log)}
                  >
                    <MaterialIcons name="delete" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
                <ThemedText style={styles.logText}>{log.text}</ThemedText>
              </View>
            ))
          )}
        </View>

        {/* Bottom Padding */}
        <View style={{ height: spacing.large }} />
      </ScrollView>

      {/* Satışçı Seçim Modal */}
      <Modal
        visible={showSellerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSellerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSellerModal(false)}
        >
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Satışçı Seç</ThemedText>
            <ScrollView showsVerticalScrollIndicator={false}>
              {activeSellers.map((seller) => (
                <TouchableOpacity
                  key={seller.id}
                  style={[
                    styles.sellerItem,
                    currentSeller?.id === seller.id && styles.selectedSeller,
                  ]}
                  onPress={() => handleAssignSeller(seller)}
                >
                  <Text style={styles.sellerAvatar}>{seller.avatar}</Text>
                  <View style={styles.sellerInfo}>
                    <ThemedText style={styles.sellerName}>{seller.name}</ThemedText>
                    <ThemedText style={styles.sellerEmail}>{seller.email}</ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowSellerModal(false)}
            >
              <ThemedText style={[styles.modalButtonText, styles.cancelButtonText]}>
                İptal
              </ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Log Ekleme Modal */}
      <Modal
        visible={showLogModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLogModal(false)}
        >
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Yeni Log Ekle</ThemedText>
            
            <TextInput
              style={styles.textInput}
              placeholder="Log metni girin..."
              placeholderTextColor={colors.textLight}
              value={newLogText}
              onChangeText={setNewLogText}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowLogModal(false);
                  setNewLogText('');
                }}
              >
                <ThemedText style={[styles.modalButtonText, styles.cancelButtonText]}>
                  İptal
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddLog}
                disabled={!newLogText.trim() || isAddingLog}
              >
                {isAddingLog ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <ThemedText style={[styles.modalButtonText, styles.confirmButtonText]}>
                    Ekle
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </ThemedView>
  );
}
