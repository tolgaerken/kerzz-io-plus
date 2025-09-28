import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@modules/auth';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useMessagesQuery } from '../../modules/data-layer/hooks/useMessagesQuery';
import { useSalesQuery } from '../../modules/data-layer/hooks/useSalesQuery';
import NotificationService from '../../modules/notifications/services/notificationService';
import { useStyles } from '../../modules/theme';
import { TSale } from '../../types/dto';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { SalesCard } from './SalesCard';
import { SalesFilter } from './SalesFilter';
import { SalesStats } from './SalesStats';
import { SalesToolbar } from './SalesToolbar';

interface SalesScreenProps {
  initialSearchQuery?: string;
}

export function SalesScreen({ initialSearchQuery }: SalesScreenProps = {}) {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  
  // Initial search query'nin tekrar arama yapmaması için ref
  const hasProcessedInitialQuery = useRef<string | null>(null);
  
  // Arama state'leri
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TSale[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Loading state'leri - hangi satışın hangi butonu loading
  const [loadingStates, setLoadingStates] = useState<{
    approving: Set<string>;
    invoiceApproving: Set<string>;
  }>({
    approving: new Set(),
    invoiceApproving: new Set(),
  });

  const { colors, spacing, fontSize } = useStyles();
  const { user } = useAuthStore();

  const salesQuery = useSalesQuery();
  const messagesQuery = useMessagesQuery();
  const createMessageMutation = messagesQuery.useCreateMessage();
  
  // Notification ile form açılma durumu
  const [isOpenedFromNotification, setIsOpenedFromNotification] = useState(false);
  const [notificationFromUserId, setNotificationFromUserId] = useState<string | null>(null);
  
  // Ref'ler ile mevcut değerleri takip et (cleanup için)
  const approvedSalesRef = useRef<TSale[]>([]);
  const isOpenedFromNotificationRef = useRef(false);
  const notificationFromUserIdRef = useRef<string | null>(null);
  const createMessageMutationRef = useRef(createMessageMutation);
  
  // Ref'leri güncel tut
  useEffect(() => {
    createMessageMutationRef.current = createMessageMutation;
  }, [createMessageMutation]);
  
  // Seçilen ay/yıl için satışları ve istatistikleri getir (arama modunda devre dışı)
  const salesStatsQuery = salesQuery.useSalesStats(selectedYear, selectedMonth, {
    enabled: !showSearchResults // Arama modunda devre dışı
  });
  
  // Mutation hook'ları
  const approveSaleMutation = salesQuery.useApproveSale();
  const approveInvoiceMutation = salesQuery.useApproveInvoice();

  // Notification'dan gelen fromUserId'yi kontrol et
  useEffect(() => {
    const checkNotificationFromUserId = async () => {
      try {
        const notificationService = NotificationService.getInstance();
        const fromUserId = await notificationService.getNotificationFromUserId();
        
        console.log('🔍 Notification fromUserId kontrolü:', {
          fromUserId,
          hasFromUserId: !!fromUserId,
          initialSearchQuery
        });
        
        if (fromUserId) {
          setIsOpenedFromNotification(true);
          setNotificationFromUserId(fromUserId);
          // Ref'leri de güncelle
          isOpenedFromNotificationRef.current = true;
          notificationFromUserIdRef.current = fromUserId;
          console.log('📱 Form notification ile açıldı, fromUserId:', fromUserId);
        } else {
          console.log('ℹ️ Form normal şekilde açıldı (notification ile değil)');
        }
      } catch (error) {
        console.error('❌ Notification fromUserId kontrolü hatası:', error);
      }
    };

    checkNotificationFromUserId();

    // Cleanup: Sayfa çıkışında fromUserId'yi temizle
    return () => {
      const isFromNotification = isOpenedFromNotificationRef.current;
      const fromUserId = notificationFromUserIdRef.current;
      
      if (isFromNotification && fromUserId) {
        const cleanupNotificationData = async () => {
          try {
            const notificationService = NotificationService.getInstance();
            await notificationService.clearNotificationFromUserId();
            console.log('🧹 Sayfa çıkışında fromUserId temizlendi');
          } catch (error) {
            console.error('❌ Cleanup fromUserId hatası:', error);
          }
        };
        cleanupNotificationData();
      }
    };
  }, [initialSearchQuery]);

  // Sayfa çıkışında özet mesaj gönder (sadece birden fazla satış onaylandıysa)
  useEffect(() => {
    // Component unmount olduğunda özet mesaj gönder
    return () => {
      const sendSummaryMessage = async () => {
        const approvedSales = approvedSalesRef.current;
        const isFromNotification = isOpenedFromNotificationRef.current;
        const fromUserId = notificationFromUserIdRef.current;
        
        if (isFromNotification && fromUserId && approvedSales.length > 1) {
          try {
            console.log('📊 Özet mesaj gönderiliyor:', {
              count: approvedSales.length,
              sales: approvedSales.map(s => s.no)
            });

            const summaryContent = `${approvedSales.length} satış onaylandı: ${approvedSales.map(s => s.no).join(', ')}`;
            
            const summaryMessageInput = {
              content: summaryContent,
              type: 'private' as const,
              targetUsers: [fromUserId],
              priority: 'medium' as const,
              importance: 'normal' as const,
              hasSound: false,
              references: approvedSales.map(sale => ({
                type: 'record' as const,
                collection: 'sales',
                recordId: sale.id!,
                displayText: `Satış: ${sale.no}`,
                route: `/(drawer)/sale-detail?saleId=${sale.id}`
              }))
            };

            await createMessageMutationRef.current.mutateAsync(summaryMessageInput);
            console.log('✅ Özet mesaj gönderildi');
          } catch (summaryError) {
            console.error('❌ Özet mesaj gönderme hatası:', summaryError);
          }
        }
      };
      
      sendSummaryMessage();
    };
  }, []); // Boş dependency array - sadece unmount'ta çalışsın

  // Loading state helper fonksiyonları
  const setApproveLoading = useCallback((saleId: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      approving: loading 
        ? new Set([...prev.approving, saleId])
        : new Set([...prev.approving].filter(id => id !== saleId))
    }));
  }, []);

  const setInvoiceApproveLoading = useCallback((saleId: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      invoiceApproving: loading 
        ? new Set([...prev.invoiceApproving, saleId])
        : new Set([...prev.invoiceApproving].filter(id => id !== saleId))
    }));
  }, []);
  
  const styles = {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.small,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    title: {
      fontSize: fontSize.xlarge,
      fontWeight: 'bold' as const,
      color: colors.text,
      textAlign: 'center' as const,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: spacing.xlarge,
    },
    errorText: {
      fontSize: fontSize.medium,
      color: colors.error,
      textAlign: 'center' as const,
      marginTop: spacing.medium,
    },
    searchContainer: {
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.small,
      backgroundColor: colors.background,
    },
    searchInputContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border + '60',
      borderRadius: 12,
      paddingHorizontal: spacing.small,
      paddingVertical: spacing.small,
    },
    searchInput: {
      flex: 1,
      fontSize: fontSize.medium,
      color: colors.text,
      paddingHorizontal: spacing.small,
      paddingVertical: 0,
    },
    searchButton: {
      padding: spacing.small,
      marginLeft: spacing.small,
    },
    clearButton: {
      padding: spacing.small,
    },
    searchResultsHeader: {
      paddingHorizontal: spacing.medium,
      paddingVertical: spacing.small,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    searchResultsTitle: {
      fontSize: fontSize.medium,
      fontWeight: 'bold' as const,
      color: colors.text,
    },
  };

  const handleYearChange = useCallback((year: number) => {
    setSelectedYear(year);
  }, []);

  const handleMonthChange = useCallback((month: number) => {
    setSelectedMonth(month);
  }, []);

  const handleRefresh = useCallback(() => {
    salesStatsQuery.refetch();
  }, [salesStatsQuery]);

  const handleSalePress = useCallback((sale: TSale) => {
    Alert.alert(
      'Satış Detayı',
      `Satış No: ${sale.no || sale.number}\nŞirket: ${sale.company}\nTutar: ${new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
      }).format(sale.grandTotal || sale.total || 0)}`,
      [{ text: 'Tamam' }]
    );
  }, []);

  const handleViewDetails = useCallback((sale: TSale) => {
    router.push({
      pathname: '/(drawer)/sale-detail',
      params: {
        saleData: JSON.stringify(sale)
      }
    });
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Satış numarası ile arama yap
      const results = await salesQuery.searchSalesByNumber(query.trim());
      setSearchResults(results || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Arama hatası:', error);
      setSearchResults([]);
      setShowSearchResults(true);
    } finally {
      setIsSearching(false);
    }
  }, [salesQuery]);

  const handleSearchInputChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  }, []);

  const handleSearchSubmit = useCallback(() => {
    handleSearch(searchQuery);
  }, [searchQuery, handleSearch]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  }, []);

  // Initial search query'yi handle et (notification'dan gelen)
  useEffect(() => {
    if (initialSearchQuery && initialSearchQuery.trim()) {
      console.log('🔍 Notification\'dan gelen arama sorgusu:', initialSearchQuery);
      
      // Eğer aynı sorgu ise tekrar arama yapma
      if (hasProcessedInitialQuery.current === initialSearchQuery) {
        console.log('⏭️ Aynı arama sorgusu, tekrar arama yapılmıyor');
        return;
      }
      
      hasProcessedInitialQuery.current = initialSearchQuery;
      
      setSearchQuery(initialSearchQuery.trim());
      
      // Direkt arama yap (handleSearch dependency'sinden kaçınmak için)
      const performSearch = async () => {
        setIsSearching(true);
        try {
          const results = await salesQuery.searchSalesByNumber(initialSearchQuery.trim());
          setSearchResults(results || []);
          setShowSearchResults(true);
          console.log('✅ Initial search tamamlandı:', results?.length || 0, 'sonuç');
        } catch (error) {
          console.error('❌ Initial search hatası:', error);
          setSearchResults([]);
          setShowSearchResults(true);
        } finally {
          setIsSearching(false);
        }
      };
      
      performSearch();
    }
  }, [initialSearchQuery, salesQuery]);

  const handleApprove = useCallback((sale: TSale) => {
    if (!sale.id) {
      console.error('Satış ID bulunamadı');
      return;
    }

    const updateData = {
      approved: !sale.approved, // Toggle approval
      approved_userId: user?.id || 'current-user-id',
      approved_userName: user?.name || 'Current User',
      approve_time: new Date(),
    };

    // Loading başlat
    setApproveLoading(sale.id!, true);

    approveSaleMutation.mutate(
      { id: sale.id!, data: updateData },
      {
        onSuccess: async () => {
          setApproveLoading(sale.id!, false);
          // Arama sonuçları gösteriliyorsa yerel listeyi güncelle
          setSearchResults(prev =>
            showSearchResults
              ? prev.map(s => (s.id === sale.id ? { ...s, ...updateData } as TSale : s))
              : prev
          );
          console.log('✅ Satış onayı güncellendi:', sale.approved ? 'Onay kaldırıldı' : 'Onaylandı');
          
          // Eğer notification ile form açıldı ise ve satış onaylandı ise mesaj gönder
          if (isOpenedFromNotification && notificationFromUserId && !sale.approved && user) {
            try {
              console.log('📨 Satış onay mesajı gönderiliyor:', {
                fromUserId: notificationFromUserId,
                currentUserId: user.id,
                saleNo: sale.no,
                company: sale.company,
                saleApproved: sale.approved,
                isOpenedFromNotification,
                conditions: {
                  isOpenedFromNotification,
                  hasNotificationFromUserId: !!notificationFromUserId,
                  saleWasNotApproved: !sale.approved,
                  hasUser: !!user
                }
              });
              
              // Mesaj input'unu oluştur
              const messageInput = messagesQuery.createSaleApprovalMessageInput(
                notificationFromUserId,
                sale
              );
              
              // Mesajı gönder
              await createMessageMutation.mutateAsync(messageInput);
              
              console.log('✅ Satış onay mesajı başarıyla gönderildi');
              
              // Onaylanan satışı listeye ekle
              const currentApprovedSales = approvedSalesRef.current;
              const isAlreadyAdded = currentApprovedSales.some(s => s.id === sale.id);
              if (!isAlreadyAdded) {
                const newList = [...currentApprovedSales, sale];
                approvedSalesRef.current = newList;
                console.log('📊 Bu oturumda onaylanan satışlar:', {
                  count: newList.length,
                  sales: newList.map(s => ({ no: s.no, company: s.company }))
                });
              }
              
              // FromUserId'yi temizleme - her satış için değil, sayfa çıkışında yapılacak
              // Bu sayede birden fazla satış onaylandığında hepsi için mesaj gönderilir
              
            } catch (messageError) {
              console.error('❌ Satış onay mesajı gönderme hatası:', messageError);
              // Hata durumunda kullanıcıya bilgi ver
              Alert.alert('Uyarı', 'Onay mesajı gönderilemedi, ancak satış başarıyla onaylandı.');
            }
          }
        },
        onError: (error: any) => {
          setApproveLoading(sale.id!, false);
          console.error('❌ Satış onayı hatası:', error);
        },
      }
    );

  }, [user, approveSaleMutation, setApproveLoading, isOpenedFromNotification, notificationFromUserId, createMessageMutation, messagesQuery, showSearchResults]);

  const handleInvoiceApprove = useCallback((sale: TSale) => {
    if (!sale.id) {
      console.error('Satış ID bulunamadı');
      return;
    }

    const updateData = {
      invoiceApproved: !sale.invoiceApproved, // Toggle invoice approval
      invoiceApprovedAt: new Date(),
      invoiceApprovedBy: user?.id || 'current-user-id',
      invoiceApprovedByName: user?.name || 'Current User',
    };

    // Loading başlat
    setInvoiceApproveLoading(sale.id!, true);

    approveInvoiceMutation.mutate(
      { id: sale.id!, data: updateData },
      {
        onSuccess: () => {
          setInvoiceApproveLoading(sale.id!, false);
          // Arama sonuçları gösteriliyorsa yerel listeyi güncelle
          setSearchResults(prev =>
            showSearchResults
              ? prev.map(s => (s.id === sale.id ? { ...s, ...updateData } as TSale : s))
              : prev
          );
          console.log('✅ Fatura onayı güncellendi:', sale.invoiceApproved ? 'Onay kaldırıldı' : 'Onaylandı');
        },
        onError: (error: any) => {
          setInvoiceApproveLoading(sale.id!, false);
          console.error('❌ Fatura onayı hatası:', error);
        },
      }
    );
  }, [user, approveInvoiceMutation, setInvoiceApproveLoading, showSearchResults]);


  const renderSaleCard = (sale: TSale) => {
    if (!sale.id) return null;
    
    return (
      <View key={sale.id || sale.no?.toString() || Math.random().toString()}>
        <SalesCard
          sale={sale}
          onPress={handleSalePress}
        />
        <SalesToolbar
          sale={sale}
          onApprove={handleApprove}
          onInvoiceApprove={handleInvoiceApprove}
          onViewDetails={handleViewDetails}
          isApprovingLoading={loadingStates.approving.has(sale.id)}
          isInvoiceApprovingLoading={loadingStates.invoiceApproving.has(sale.id)}
        />
      </View>
    );
  };

  if (salesStatsQuery.error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Satışlar</ThemedText>
        </View>
        
        <SalesFilter
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={handleYearChange}
          onMonthChange={handleMonthChange}
        />
        
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            Satış verileri yüklenirken bir hata oluştu.
          </ThemedText>
          <ThemedText style={[styles.errorText, { fontSize: 14, marginTop: 8 }]}>
            {salesStatsQuery.error.message}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const sales = salesStatsQuery.data || [];
  const displaySales = showSearchResults ? searchResults : sales;

  return (
    <ThemedView style={styles.container}>
      {/* Arama Kutusu */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color={colors.text + '60'} />
          <TextInput
            style={styles.searchInput}
            placeholder="Satış numarası ile ara..."
            placeholderTextColor={colors.text + '60'}
            value={searchQuery}
            onChangeText={handleSearchInputChange}
            onSubmitEditing={handleSearchSubmit}
            keyboardType="numeric"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearSearch}>
              <MaterialIcons name="clear" size={20} color={colors.text + '60'} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchSubmit}>
            <MaterialIcons name="search" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtreler - Fixed (sadece arama sonuçları gösterilmiyorsa) */}
      {!showSearchResults && (
        <SalesFilter
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={handleYearChange}
          onMonthChange={handleMonthChange}
        />
      )}

      {/* Scrollable Content */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={salesStatsQuery.isFetching && !salesStatsQuery.isLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Arama Sonuçları Başlığı */}
        {showSearchResults && (
          <View style={styles.searchResultsHeader}>
            <ThemedText style={styles.searchResultsTitle}>
              Arama Sonuçları ({searchResults.length} sonuç)
            </ThemedText>
          </View>
        )}

        {/* İstatistikler (sadece normal görünümde) */}
        {!showSearchResults && <SalesStats stats={salesStatsQuery.stats} />}

        {/* Arama Loading State */}
        {isSearching && (
          <View style={{ padding: spacing.xlarge, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={{ marginTop: spacing.medium, color: colors.textLight }}>
              Aranıyor...
            </ThemedText>
          </View>
        )}

        {/* Normal Loading State */}
        {!showSearchResults && salesStatsQuery.isLoading && (
          <View style={{ padding: spacing.xlarge, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={{ marginTop: spacing.medium, color: colors.textLight }}>
              Satışlar yükleniyor...
            </ThemedText>
          </View>
        )}

        {/* Empty State */}
        {!isSearching && !salesStatsQuery.isLoading && displaySales.length === 0 && (
          <View style={{ padding: spacing.xlarge, alignItems: 'center' }}>
            <ThemedText style={{ color: colors.textLight, textAlign: 'center' }}>
              {showSearchResults ? 'Arama sonucu bulunamadı' : 'Seçilen dönemde satış bulunamadı'}
            </ThemedText>
          </View>
        )}

        {/* Satış Listesi */}
        {!isSearching && displaySales.map((sale) => renderSaleCard(sale))}

        {/* Bottom Padding */}
        <View style={{ height: spacing.medium }} />
      </ScrollView>
    </ThemedView>
  );
}
