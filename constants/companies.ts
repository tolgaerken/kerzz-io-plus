// Şirket bilgileri için interface
export interface TOurCompany {
  id: string;
  idc: string;
  name: string;
  cloudDb: string;
  licanceId: string;
  eInvoice: boolean;
  vatNo: string;
  noVat: boolean;
  exemptionReason: string;
  description?: string;
} 

/**
 * Orwi Sales uygulamasında kullanılan şirket bilgileri
 * Bu veriler projenin çeşitli yerlerinde kullanılacak
 */
export const OUR_COMPANIES: readonly TOurCompany[] = [
  {
    id: 'VERI',
    idc: 'veri',
    name: 'VERİ YAZILIM A.Ş.',
    cloudDb: '218',
    licanceId: '349',
    eInvoice: true,
    vatNo: '9240485845',
    noVat: false,
    exemptionReason: '',
  },
  {
    id: 'CLOUD',
    idc: 'cloud',
    name: 'CLOUD LABS A.Ş.',
    cloudDb: '7040',
    licanceId: '',
    eInvoice: true,
    vatNo: '2111178189',
    noVat: false,
    exemptionReason: '',
  },
  {
    id: 'ETYA',
    idc: 'etya',
    name: 'ETYA RESEARCH A.Ş.',
    cloudDb: '6391',
    licanceId: '',
    eInvoice: true,
    vatNo: '',
    noVat: true,
    exemptionReason: '223',
    description: `<br>STB Proje Kodu 097920 nolu proje kapsamında KDV ve Gelir Vergisinden istisna olarak düzenlenmiştir`,
  },
  {
    id: 'BTT',
    idc: 'btt',
    name: 'BTT TEKNOLOJİ A.Ş.',
    cloudDb: '256',
    licanceId: '',
    eInvoice: true,
    vatNo: '1871283060',
    noVat: false,
    exemptionReason: '',
  },
  {
    id: 'MARKA',
    idc: 'markamutfagi',
    name: 'MARKA MUTFAĞI A.Ş.',
    cloudDb: '4165',
    licanceId: '',
    eInvoice: true,
    vatNo: '6121332112',
    noVat: false,
    exemptionReason: '',
  },
  {
    id: 'KERZZBV',
    idc: 'kerzzbv',
    name: 'Kerzz B.V.',
    cloudDb: '',
    licanceId: '',
    eInvoice: false,
    vatNo: '',
    noVat: false,
    exemptionReason: '',
  },
] as const;

// Şirket ID'lerine göre hızlı erişim için map
export const COMPANIES_BY_ID = OUR_COMPANIES.reduce((acc, company) => {
  acc[company.id] = company;
  return acc;
}, {} as Record<string, TOurCompany>);

// Şirket IDC'lerine göre hızlı erişim için map
export const COMPANIES_BY_IDC = OUR_COMPANIES.reduce((acc, company) => {
  acc[company.idc] = company;
  return acc;
}, {} as Record<string, TOurCompany>);

// Şirket isimlerine göre hızlı erişim için map
export const COMPANIES_BY_NAME = OUR_COMPANIES.reduce((acc, company) => {
  acc[company.name] = company;
  return acc;
}, {} as Record<string, TOurCompany>);

