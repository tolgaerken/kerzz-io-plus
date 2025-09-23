export interface TBankTransactions {
  id: string;
  accounId: string;
  name: string;
  dc: string;
  code: string;
  amount: number;
  balance: number;
  description: string;
  businessDate: Date;
  createDate: Date;
  opponentId: string;
  opponentIban: string;
  sourceId: string;
  source: string;
  bankAccId: string;
  bankAccName: string;
  bankId: string;
  bankName: string;
  erpStatus: TErpStatus;
  erpMessage: string;
  erpGlAccountCode: string;
  erpAccountCode: string;
}

export type TErpStatus = 'waiting' | 'error' | 'success' | 'manual';

export interface TBankAccount {
  bankAccId: string;
  bankAccName: string;
  erpCompanyId: string;
  erpMuhCode: string;
}

export interface TBankErpMapping {
  id: string;
  bankId: string;
  opponentIban: string;
  erpAccountCode?: string;
  erpGlAccountCode?: string;
}

export interface BankSummary {
  bankAccId: string;
  bankAccName: string;
  inflow: number;
  outflow: number;
  balance: number;
}

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface BankTransactionFilters {
  status?: TErpStatus;
  dateRange?: DateRange;
  bankAccId?: string;
  searchText?: string;
  transactionType?: 'all' | 'inflow' | 'outflow'; // Yeni: giriş/çıkış filtresi
}

// Socket güncellemeleri için
export interface SocketBankUpdate {
  operationType: 'insert' | 'update' | 'delete';
  fullDocument?: TBankTransactions;
  documentKey?: { _id: string };
}

// API response types
export interface BankTransactionsResponse {
  data: TBankTransactions[];
  total: number;
  page: number;
  limit: number;
}

export interface BankAccountsResponse {
  data: TBankAccount[];
}
