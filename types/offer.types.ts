import { BaseModel } from '../modules/data-layer/types/mongo';

export interface TOffer extends BaseModel {
  parentId: string;
  no: number;
  code: string;
  number: number;
  customerId: string;
  licanceId: string;
  company: string;
  brand: string;
  description: string;
  saleDate: Date;
  implementDate: Date;
  sellerName: string;
  sellerId: string;
  resellerId: string;
  resellerName: string;
  paid: number;
  implement: boolean;
  invoices: [];

  approved: boolean;
  approved_userId: string;
  approved_userName: string;
  approve_time: Date;
  invoiceApproved: boolean;
  invoiceApprovedAt: Date;
  invoiceApprovedBy: string;
  invoiceApprovedByName: string;

  products: TOfferRow[];
  licances: TOfferRow[];
  rentys: TOfferRow[];

  total: number;
  discount: number;
  tax: number;
  grandTotal: number;
  usdRate: number;
  eurRate: number;

  note: string;

  userId: string;
  userName: string;
  internalFirm: string;
  labels: any[];
  payments: TOfferPayment[];
  logLevel: number;
  logs: [];
  hardwareTotal: number;
  softwareTotal: number;
  saasTotal: number;
  paymentTotal: number;
  hardwareCost: number;
  usdTotal: number;
  profit: number;
  profitTl: number;

  erpBalance: number;
  status: TOfferStatus[];
  shipping?: string;

  invoiceEnabled: boolean;
  dispatchEnabled: boolean;
  documentsDone: boolean;
  mailList: TMailList[];
  offerNote: string;

  transformFromOfferInfo: TOfferConvertInfo;
  hasInvoice: boolean;
  editDate: Date;
  editUser: string;
}

export type TOfferStatus =
  | 'init'
  | 'offer-waiting'
  | 'approve-waiting'
  | 'collection-waiting'
  | 'setup-waiting'
  | 'training-waiting'
  | 'offer-done'
  | 'approve-done'
  | 'collection-done'
  | 'setup-done'
  | 'training-done'
  | 'planning-waiting'
  | 'done'
  | 'offer-approved'
  | 'offer-loose'
  | 'offer-win';

export interface TOfferRow {
  id: string;
  productId: string;
  erpId: string;
  name: string;
  description: string;
  qty: number;
  unit: string;
  localPrice: number;
  price: number;

  discountRate: number;
  discountTotal: number;

  taxRate: number;
  taxTotal: number;

  total: number;
  subTotal: number;
  grandTotal: number;

  localTotal: number;
  currency: 'tl' | 'eur' | 'usd';

  yearly: boolean;
  renty: boolean;
  rentPeriod: number;

  parentId: string;

  invoiceNo: string;
  unitCost: number;
  totalCost: number;

  shippingInfo: TShippingInfo;
  setupInfo: TSetupInfo;
}

export interface TShippingInfo {
  sent: boolean;
  shipping_method: string;
  cargo_company: string;
  carog_id: string;
  sender_user_id: string;
  sender_user_name: string;
  sent_time: Date;
}

export interface TSetupInfo {
  setup_done: boolean;
  setup_user_id: string;
  setup_user_name: string;
  setup_time: Date;
}

export interface TOfferPayment {
  id: string;
  date: Date;
  expiry: Date;
  paymentType: string;
  description: string;
  amount: number;
  done: boolean;
}

export interface TMailList {
  id: string;
  name: string;
  mail: string;
  gsm: string;
}

export interface TOfferConvertInfo {
  offerId: string;
  converted: boolean;
  converUserId: string;
  convertTime: Date;
  saleNo: number;
}

