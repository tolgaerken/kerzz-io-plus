import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  BankSummary,
  BankTransactionFilters,
  TBankAccount,
  TBankTransactions,
  TErpStatus
} from '../types/bank.types';

// Simplified Zustand store for UI state only
// Data fetching is handled by React Query through useBankTransactionsQuery
interface BankStore {
  // UI State
  filters: BankTransactionFilters;
  
  // Actions
  setFilters: (filters: BankTransactionFilters) => void;
  updateFilters: (partialFilters: Partial<BankTransactionFilters>) => void;
  clearFilters: () => void;
}

// Zustand store - sadece UI state için
const useBankStore = create<BankStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    filters: {
      dateRange: {
        startDate: null,
        endDate: null
      }
    },

    // Actions
    setFilters: (filters) => set({ filters }),
    
    updateFilters: (partialFilters) => 
      set({ filters: { ...get().filters, ...partialFilters } }),
    
    clearFilters: () => set({ 
      filters: {
        dateRange: {
          startDate: null,
          endDate: null
        },
        transactionType: 'all'
      }
    }),
  }))
);

/**
 * Bank Integration Service
 * Data-layer pattern kullanarak React Query ile veri yönetimi
 * Bu service artık sadece utility functions içerir
 */
class BankIntegrationService {
  
  /**
   * Calculate bank summaries from transactions
   */
  calculateBankSummaries(transactions: TBankTransactions[], bankAccounts: TBankAccount[]): BankSummary[] {
    const summaryMap = new Map<string, BankSummary>();

    transactions.forEach(transaction => {
      if (!summaryMap.has(transaction.bankAccId)) {
        const bankAccount = bankAccounts.find(acc => acc.bankAccId === transaction.bankAccId);
        summaryMap.set(transaction.bankAccId, {
          bankAccId: transaction.bankAccId,
          bankAccName: bankAccount?.bankAccName || transaction.bankAccName,
          inflow: 0,
          outflow: 0,
          balance: 0
        });
      }

      const summary = summaryMap.get(transaction.bankAccId)!;
      
      if (transaction.amount > 0) {
        summary.inflow += transaction.amount;
      } else {
        summary.outflow += Math.abs(transaction.amount);
      }
      
      summary.balance += transaction.amount;
    });

    return Array.from(summaryMap.values());
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: TErpStatus): string {
    switch (status) {
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      case 'manual': return '#ffc107';
      case 'waiting': return '#6c757d';
      default: return '#6c757d';
    }
  }

  /**
   * Get status text for display
   */
  getStatusText(status: TErpStatus): string {
    switch (status) {
      case 'success': return 'İşlendi';
      case 'error': return 'Hatalı';
      case 'manual': return 'Manuel';
      case 'waiting': return 'Bekliyor';
      default: return 'Bilinmiyor';
    }
  }

  /**
   * Create default date range (today)
   */
  getDefaultDateRange(): { startDate: Date; endDate: Date } {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    return {
      startDate: startOfDay,
      endDate: endOfDay
    };
  }

  /**
   * Create date range for quick filters
   */
  getQuickDateRange(type: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth'): { startDate: Date; endDate: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (type) {
      case 'today':
        return {
          startDate: today,
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          startDate: yesterday,
          endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { startDate: startOfWeek, endDate: endOfWeek };
      case 'lastWeek':
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 6); // Last Monday
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        lastWeekEnd.setHours(23, 59, 59, 999);
        return { startDate: lastWeekStart, endDate: lastWeekEnd };
      case 'thisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        return { startDate: startOfMonth, endDate: endOfMonth };
      case 'lastMonth':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        lastMonthEnd.setHours(23, 59, 59, 999);
        return { startDate: lastMonthStart, endDate: lastMonthEnd };
      default:
        return this.getDefaultDateRange();
    }
  }

  /**
   * Filter transactions by excluded bank account IDs
   */
  filterExcludedBankAccounts(transactions: TBankTransactions[], excludedBankAccIds: string[] = []): TBankTransactions[] {
    if (excludedBankAccIds.length === 0) {
      return transactions;
    }
    
    return transactions.filter(transaction => 
      !excludedBankAccIds.includes(transaction.bankAccId?.toString())
    );
  }

  /**
   * Calculate totals from transactions
   */
  calculateTotals(transactions: TBankTransactions[]) {
    let totalInflow = 0;
    let totalOutflow = 0;
    let totalBalance = 0;

    transactions.forEach(transaction => {
      if (transaction.amount > 0) {
        totalInflow += transaction.amount;
      } else {
        totalOutflow += Math.abs(transaction.amount);
      }
      totalBalance += transaction.amount;
    });

    return {
      totalInflow,
      totalOutflow,
      totalBalance,
      transactionCount: transactions.length
    };
  }
}

// Singleton instance
export const bankIntegrationService = new BankIntegrationService();

// Export store hook
export { useBankStore };
