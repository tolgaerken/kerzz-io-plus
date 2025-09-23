export interface TBankTransactions {
  id: string,
  accounId: string,
  name: string,
  dc: string,
  code: string,
  amount: 0,
  balance: 0,
  description: string,
  businessDate: Date,
  createDate: Date,
  opponentId: string,
  opponentIban: string,
  sourceId: string,
  source: string,
  bankAccId: string,
  bankAccName: string,
  bankId: string,
  bankName: string
  erpStatus: TErpStatus,
  erpMessage: string
  erpGlAccountCode: string
  erpAccountCode: string
}


export type TErpStatus = 'waiting' | 'error' | 'success' | 'manual'

export interface TBankAccount {
  bankAccId: string,
  bankAccName: string,
  erpCompanyId: string,
  erpMuhCode: string
}

export interface TBankErpMapping {
  id: string,
  bankId: string,
  opponentIban: string,
  erpAccountCode?: string,
  erpGlAccountCode?: string
}
