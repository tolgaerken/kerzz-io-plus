/**
 * Netsis ERP Type Tanımları
 * Angular servisinden uyarlandı
 */

// Fatura tipi
export interface TNetsisInvoice {
  TARIH: Date;
  CARI_KODU: string;
  KDV: number;
  BRUTTUTAR: number;
  GENELTOPLAM: number;
  FATIRS_NO: string;
  FTIRSIP: number;
  alt?: TNetsisInvoiceDetail;
}

// Fatura detay
export interface TNetsisInvoiceDetail {
  FATIRSNO: string;
  [key: string]: any;
}

// Cari hesap
export interface TNetsisAccount {
  ID: string;
  name: string;
}

// Cari hareket
export interface TNetsisTransaction {
  TARIH: Date;
  ACIKLAMA: string;
  BORC: number;
  ALACAK: number;
  BELGE_NO: string;
  HAREKET_TURU: string;
  DOVIZ_TURU?: string;
  DOVIZ_TUTAR?: number;
  CARI_KOD: string;
}

// Bakiye
export interface TNetsisBalance {
  BAKIYE: number;
  CARI_KOD?: string;
}

// Belge detayı
export interface TNetsisDocumentDetail {
  STOK_KODU: string;
  STOK_ADI: string;
  STHAR_KDV: number;
  MIKTAR: number;
  DOV_FIYAT: number;
  DOVIZ: string;
  BIRIM_FIYAT: number;
  TOPLAM: number;
}

// ERP Bakiye Listesi (SP_CARI_BORC_YAS)
export interface TErpBalanceList {
  CariKodu: string;
  CariUnvan: string;
  CariBakiye: number;
  ToplamGecikme: number;
  VadesiGelmemis: number;
  GECIKMEGUN: number;
  CariVade: number;
  Bugun: number;
  VergiNo?: string;
  TcKimlik?: string;
  EkAcik1?: string;
  GrupKodu?: string | null;
  Limiti: number;
  [key: string]: any;
}

// Stok bakiyesi
export interface TNetsisStockBalance {
  STOK_KODU: string;
  STOK_ADI: string;
  MIKTAR: number;
  BIRIM: string;
  DEPO_ADI?: string;
  [key: string]: any;
}

// Muhasebe pivot
export interface TNetsisMuhPivot {
  ANA_HESAP: string;
  ANAHESAP_ADI: string;
  GRUP1: string;
  GRUP1_ISIM: string;
  GRUP2: string;
  HES_KOD: string;
  HESAP_ADI: string;
  AY_KODU: number;
  FISNO: string;
  SIRA: number;
  TARIH: Date;
  BA: number; // 1: Borç, 2: Alacak
  ACIKLAMA: string;
  TUTAR: number;
  MIKTAR?: number;
  EVRAKTARIHI?: Date;
  ENTEGREFKEY?: string;
  ISLEMTIPI?: string;
  PK?: string; // Proje kodu
  KAYITTARIHI?: Date;
}

// SQL Query parametreleri
export interface NetsisSqlParams {
  year: string | number;
  company: string;
  accountId?: string;
  documentId?: string;
}

// SQL Response wrapper
export interface NetsisSqlResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

