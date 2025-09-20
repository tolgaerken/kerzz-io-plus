import { BaseModel } from "@/modules/data-layer";

export interface TLicense extends BaseModel {
  id: string;
  no: number;
  creation: Date;
  customerId: string;
  customerName: string;
  brandName: string;
  address: TAddress;
  phone: string;
  email: string;
  chainId: string;
  resellerId: string;
  persons: TPerson[];
  person: string;

  block: boolean;
  blockMessage?: string;
  isOpen: boolean;
  active: boolean;

  saasItems: TLicenseItem[];
  licenseItems: TLicenseItem[];

  licenseId: number;

  lastOnline: Date;
  lastIp: string;
  lastVersion: string;
  assetCode: number;

  hasRenty: boolean;
  hasLicense: boolean;
  haveContract: boolean;
  hasBoss: boolean;
  type: 'kerzz-pos' | 'orwi-pos' | 'kerzz-cloud';
  currentVersion: string;
  orwiStore: TOrwiStore;

  SearchItem?: string;
  companyType: 'chain' | 'single';
  kitchenType: string;

  _id?: any;
}

export interface TPerson {
  id: string;
  name: string;
  role: string;
  email: string;
  gsm: string;
}

export interface TAddress {
  address: string;
  cityId: number;
  city: string;
  townId: number;
  town: string;
  countryId: string;
  country: string;
}

export interface TLicenseItem {
  id: string;
  moduleId: string;
  name: string;
  qty: number;
  subItems?: any[];
}

export interface TLicenseModule {
  id: string;
  moduleId: string;
  name: string;
  subItems?: any[];
  erpId: string;
  price: number;
  supportPrice: number;
}

export interface TLicenseType {
  id: string;
  name: string;
}

export interface TOrwiStore {
  id: string;
  name: string;
  cloudId: string;
}

export interface TKitchenTypes {
  id: string;
  name: string;
}

// License search parameters
export interface LicenseSearchParams {
  customerName?: string;
  brandName?: string;
  type?: 'kerzz-pos' | 'orwi-pos' | 'kerzz-cloud';
  companyType?: 'chain' | 'single';
  active?: boolean;
  block?: boolean;
  isOpen?: boolean;
  city?: string;
  phone?: string;
  email?: string;
  hasContract?: boolean;
  customerId?: string;
}

// License create request
export interface LicenseCreateRequest {
  customerId: string;
  customerName: string;
  brandName: string;
  address: TAddress;
  phone: string;
  email: string;
  chainId?: string;
  resellerId?: string;
  persons?: TPerson[];
  person?: string;
  type: 'kerzz-pos' | 'orwi-pos' | 'kerzz-cloud';
  companyType: 'chain' | 'single';
  kitchenType: string;
  saasItems?: TLicenseItem[];
  licenseItems?: TLicenseItem[];
  orwiStore?: TOrwiStore;
}

// License update request
export interface LicenseUpdateRequest {
  id: string;
  customerName?: string;
  brandName?: string;
  address?: TAddress;
  phone?: string;
  email?: string;
  chainId?: string;
  resellerId?: string;
  persons?: TPerson[];
  person?: string;
  block?: boolean;
  blockMessage?: string;
  isOpen?: boolean;
  active?: boolean;
  saasItems?: TLicenseItem[];
  licenseItems?: TLicenseItem[];
  kitchenType?: string;
  orwiStore?: TOrwiStore;
} 