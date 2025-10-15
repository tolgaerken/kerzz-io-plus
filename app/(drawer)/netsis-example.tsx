/**
 * Netsis Integration Örnek Ekran
 * TanStack Query ile Netsis ERP verileri
 */

import {
  useNetsisAccountDetails,
  useNetsisAccounts,
  useNetsisInvalidation,
} from '@/modules/data-layer';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NetsisExampleScreen() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const year = '2024';
  const company = 'VERI';

  // Hesapları getir
  const {
    data: accounts,
    isLoading: accountsLoading,
    error: accountsError,
  } = useNetsisAccounts(year, company);

  // Seçili hesap detayları
  const {
    account,
    balance,
    transactions,
    isLoading: detailsLoading,
    refetch: refetchDetails,
  } = useNetsisAccountDetails(selectedAccountId || '', year, company);

  // Cache invalidation
  const { invalidateAll, invalidateAccounts } = useNetsisInvalidation();

  if (accountsLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Hesaplar yükleniyor...</Text>
      </View>
    );
  }

  if (accountsError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Hata: {accountsError.message}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => invalidateAccounts(year, company)}
        >
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Text style={styles.title}>Netsis Entegrasyonu</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={() => invalidateAll()}>
          <Text style={styles.refreshButtonText}>🔄 Yenile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Hesaplar Listesi */}
        <View style={styles.accountsSection}>
          <Text style={styles.sectionTitle}>
            Cari Hesaplar ({accounts?.length || 0})
          </Text>
          <FlatList
            data={accounts}
            keyExtractor={(item) => item.ID}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.accountItem,
                  selectedAccountId === item.ID && styles.accountItemSelected,
                ]}
                onPress={() => setSelectedAccountId(item.ID)}
              >
                <Text style={styles.accountName}>{item.name}</Text>
                <Text style={styles.accountCode}>{item.ID}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Hesap Detayları */}
        {selectedAccountId && (
          <View style={styles.detailsSection}>
            <View style={styles.detailsHeader}>
              <Text style={styles.sectionTitle}>Hesap Detayları</Text>
              <TouchableOpacity onPress={refetchDetails}>
                <Text style={styles.refreshIcon}>🔄</Text>
              </TouchableOpacity>
            </View>

            {detailsLoading ? (
              <ActivityIndicator size="small" color="#0066cc" />
            ) : (
              <>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountInfoTitle}>{account?.name}</Text>
                  <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>Bakiye:</Text>
                    <Text
                      style={[
                        styles.balanceAmount,
                        balance < 0 ? styles.balanceNegative : styles.balancePositive,
                      ]}
                    >
                      {balance.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      ₺
                    </Text>
                  </View>
                </View>

                <Text style={styles.transactionsTitle}>
                  Hareketler ({transactions?.length || 0})
                </Text>
                <FlatList
                  data={transactions}
                  keyExtractor={(item, index) => `${item.BELGE_NO}-${index}`}
                  renderItem={({ item }) => (
                    <View style={styles.transactionItem}>
                      <View style={styles.transactionHeader}>
                        <Text style={styles.transactionDate}>
                          {new Date(item.TARIH).toLocaleDateString('tr-TR')}
                        </Text>
                        <Text style={styles.transactionDoc}>{item.BELGE_NO}</Text>
                      </View>
                      <Text style={styles.transactionDesc} numberOfLines={2}>
                        {item.ACIKLAMA}
                      </Text>
                      <View style={styles.transactionAmounts}>
                        <View style={styles.amountGroup}>
                          <Text style={styles.amountLabel}>Borç:</Text>
                          <Text style={styles.debitAmount}>
                            {item.BORC.toLocaleString('tr-TR')} ₺
                          </Text>
                        </View>
                        <View style={styles.amountGroup}>
                          <Text style={styles.amountLabel}>Alacak:</Text>
                          <Text style={styles.creditAmount}>
                            {item.ALACAK.toLocaleString('tr-TR')} ₺
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                  style={styles.transactionsList}
                />
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#0066cc',
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  accountsSection: {
    width: '40%',
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  detailsSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  accountItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  accountItemSelected: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  accountName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  accountCode: {
    fontSize: 12,
    color: '#666',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshIcon: {
    fontSize: 20,
  },
  accountInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  accountInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  balancePositive: {
    color: '#4caf50',
  },
  balanceNegative: {
    color: '#f44336',
  },
  transactionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  transactionsList: {
    flex: 1,
  },
  transactionItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionDoc: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  transactionDesc: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  transactionAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  amountGroup: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  debitAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
  creditAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    backgroundColor: '#0066cc',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});


