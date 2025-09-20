import { BaseModel } from '@/modules/data-layer';
import { TAddress, TPerson } from './common.types';

export interface TCustomer extends BaseModel {
  id: string;
  erpId: string;
  name: string;
  brand: string;
  taxOffice: string;
  taxNo: string;
  address: TAddress;
  email: string;
  phone: string;
  authorizedPerson: string;
  erpBalance: number;
  lateFeeType: LateFeeType;
  increaseRateType: IncreaseRateType;
  segment: CustomerSegment;
  person: string;
  persons: TPerson[];
  searchItem?: string;
  no: number;
  paymentDays: number;
  contractCount?: number;
  isActive: boolean;
}

export type CustomerSegment = 'standart' | 'silver' | 'bronze' | 'gold' | 'platin' | 'diamond';
export type LateFeeType = "yi-ufe" | "yi-ufe-tufe" | "tufe2" | "custom" | 'none';
export type IncreaseRateType = "yi-ufe" | "yi-ufe-tufe" | "tufe2" | "custom";

export interface CustomerCreateRequest {
  name: string;
  brand?: string;
  taxOffice?: string;
  taxNo?: string;
  address: TAddress;
  email?: string;
  phone?: string;
  authorizedPerson?: string;
  segment?: CustomerSegment;
  paymentDays?: number;
}

export interface CustomerUpdateRequest extends Partial<CustomerCreateRequest> {
  id: string;
}

export interface CustomerSearchParams {
  name?: string;
  taxNo?: string;
  segment?: CustomerSegment;
  city?: string;
  isActive?: boolean;
} 