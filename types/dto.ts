

import { BaseModel } from '../modules/data-layer/types/mongo';

export interface TSale extends BaseModel {
  parentId: string
  no: number
  code: string
  number: number
  customerId: string
  licanceId: string
  company: string
  brand: string
  description: string
  saleDate: Date
  implementDate: Date
  sellerName: string
  sellerId: string
  resellerId: string
  resellerName: string
  paid: number
  implement: boolean
  invoices: []

  approved: boolean
  approved_userId: string
  approved_userName: string
  approve_time: Date

  products: TSaleRow[]
  licances: TSaleRow[]
  rentys: TSaleRow[]

  total: number
  discount: number
  tax: number
  grandTotal: number
  usdRate: number
  eurRate: number

  note: string

  userId: string
  userName: string
  internalFirm: string
  labels: any[]
  payments: TSalePayment[]
  logLevel: number
  logs: []
  hardwareTotal: number
  softwareTotal: number
  saasTotal: number
  paymentTotal: number
  hardwareCost: number
  usdTotal: number
  profit: number
  profitTl: number

  erpBalance: number
  status: TSaleStatus[]
  shipping?: string

  invoiceEnabled: boolean
  dispatchEnabled: boolean
  documentsDone: boolean
  mailList: TMailList[]
  offerNote: string

  transformFromOfferInfo: TOfferConvertInfo
  hasInvoice: boolean
}

export type TSaleStatus = 'init'
  | 'offer-waiting' | 'approve-waiting' | 'collection-waiting' | 'setup-waiting' | 'training-waiting'
  | 'offer-done' | 'approve-done' | 'collection-done' | 'setup-done' | 'training-done' | 'planning-waiting'
  | 'done' | 'offer-approved' | 'offer-loose' | 'offer-win'

export interface TSaleRow {
  id: string
  productId: string
  erpId: string
  name: string
  description: string
  qty: number
  unit: string
  localPrice: number
  price: number

  discountRate: number
  discountTotal: number

  taxRate: number
  taxTotal: number

  total: number
  subTotal: number
  grandTotal: number

  localTotal: number
  currency: 'tl' | 'eur' | 'usd'

  yearly: boolean
  renty: boolean
  rentPeriod: number

  parentId: string

  invoiceNo: string
  unitCost: number
  totalCost: number

  shippingInfo: TShippingInfo

  setupInfo: TSetupInfo
}

export interface TShippingInfo {
  sent: boolean
  shipping_method: string
  cargo_company: string
  carog_id: string
  sender_user_id: string
  sender_user_name: string
  sent_time: Date
}

export interface TSetupInfo {
  setup_done: boolean
  setup_user_id: string
  setup_user_name: string
  setup_time: Date
}

export interface TSaleProduct {
  id: string
  name: string
  erpId: string
  price: number
  cost: number
  taxRate: number
  currency: 'tl' | 'eur' | 'usd'
  type: 'software' | 'hardware' | 'service'
  balance: number
  totalCost: number
  visibleOnSale: boolean
  deleted: boolean
}

export interface TSalePayment {
  id: string
  date: Date
  expiry: Date
  paymentType: string
  description: string
  amount: number
  done: boolean
}

export interface TSaleFormSection {
  id: number
  text: string
  value: string
  badge?: string
  showOffer?: boolean
  showSale?: boolean
}

export interface TSaleTotal {
  id: string
  desc: string
  usd: number
  eur: number
  tl: number
  gt: number
}

export interface TMailList {
  id: string
  name: string
  mail: string
  gsm: string
}

export interface TSaleOfferMail {
  id: string
  content: string
  createDate: Date
  isRead: boolean
  readIpAddress: boolean
  saleOfferId: string
  senderMail: string
  senderName: string
  senderPhone: string
  subject: string
  title: string
  toMailList: string[]
  readDate: Date
}

export interface TOfferConvertInfo {
  offerId: string
  converted: boolean
  converUserId: string
  convertTime: Date
  saleNo: number
}

export interface TSaleLog {
  saleId: string
  offerId: string
  userId: string
  userName: string
  date: Date
  desc: string
}


export interface TOpportunity {
    

  id: string
  no: number
  date: Date
  company: string
  brand: string
  description: string
  name: string
  email: string
  phone: string
  opponent: string
  haveOpponentSystem: boolean
  status: string
  type: string
  userId: string
  sellerId: string
  logs: TOpportunityLog[],
  requestType: string,
  heat: string,
  customerType: string,
  cityId: number,
  city: string,
  townId: number,
  town: string,
  request: string,
  channel: string,
  property: string[],
  
  
}

export interface TOpportunityLog {
  id: string
  date: Date
  text: string
  userId: string
  userName: string
}