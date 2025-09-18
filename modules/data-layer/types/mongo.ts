/**
 * MongoDB operasyonları için tip tanımları
 * Angular t-base-mongo.dto.ts'den uyarlandı
 */

// Base model interface
export interface BaseModel {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  creatorId?: string;
  updaterId?: string;
}

// MongoDB get parametreleri
export interface MongoGetParams {
  col: string;
  db?: string;
  filter?: any;
  project?: any;
  limit?: number;
  skip?: number;
  sort?: any;
  withTotalCount?: boolean;
}

// MongoDB upsert parametreleri
export interface MongoUpsertParams {
  col: string;
  db?: string;
  data: { id?: string; [key: string]: any };
}

// MongoDB delete parametreleri
export interface MongoDeleteParams {
  col: string;
  db?: string;
  filter: any;
}

// Socket MongoDB operasyonları
export interface SocketMongo {
  operationType: 'insert' | 'update' | 'delete';
  fullDocument?: any;
  documentKey?: { id: string };
  updateDescription?: {
    updatedFields: any;
    removedFields?: string[];
  };
  ns: {
    db: string;
    coll: string;
  };
}

// MongoDB payload tipleri
export interface MongoPayload {
  job: 'get' | 'upsert' | 'delete';
  database: string;
  collection: string;
  filter?: any;
  data?: any;
  projection?: any;
  limit?: number;
  skip?: number;
  sort?: any;
  withTotalCount?: boolean;
}

// Hook state tipleri
export interface BaseMongoState<T extends BaseModel> {
  items: T[];
  activeItem: T | null;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  lastFetchParams: MongoGetParams | null;
}

// Hook options
export interface BaseMongoOptions {
  database: string;
  collection: string;
  autoFetch?: boolean;
  socketUpdates?: boolean;
}

// Hook return type
export interface BaseMongoHook<T extends BaseModel> extends BaseMongoState<T> {
  // Data operations
  fetchData: (params?: Partial<MongoGetParams>) => Promise<T[]>;
  fetchDataOnly: (params?: Partial<MongoGetParams>) => Promise<T[]>;
  upsert: (id: string, data: Partial<T>) => Promise<T>;
  delete: (idOrFilter: string | object) => Promise<any>;
  
  // Item operations
  setActiveItem: (item: T | null) => void;
  upsertItem: (id: string, data: Partial<T>) => void;
  updateItem: (id: string, data: Partial<T>) => boolean;
  deleteItem: (id: string) => void;
  
  // Utility functions
  resetService: () => void;
  getStaticItems: () => T[];
  setStaticItems: () => void;
  
  // Socket events
  onSocketUpdates: (callback: (data: SocketMongo) => void) => () => void;
  onFetchCompleted: (callback: (completed: boolean) => void) => () => void;
}

// Customer model extending BaseModel
export interface CustomerModel extends BaseModel {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
  visitCount?: number;
  lastVisit?: Date;
  tags?: string[];
  status?: 'active' | 'inactive' | 'blocked';
  customerTypeId?: string;
}

// Time slot filter interface
export interface TimeSlotFilter {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  color: string;
}

// Restaurant model extending BaseModel
export interface RestaurantModel extends BaseModel {
  name: string;
  address: string;
  phone: string;
  mobilePhone?: string;
  logoUrl?: string;
  openingHours: {
    [key: string]: {
      isOpen: boolean;
      openTime: string;
      closeTime: string;
      hasSessionSystem?: boolean; // Gün bazında oturum sistemi
      sessions?: Array<{
        name: string;
        startTime: string;
        endTime: string;
      }>;
    };
  };
  authorizedPersons: Array<{
    name: string;
    title: string;
    phone: string;
    email?: string;
  }>;
  dressCode?: string;
  gracePeriod: number; // minutes
  timeSlotFilters?: TimeSlotFilter[]; // Zaman dilimi filtreleri
}
