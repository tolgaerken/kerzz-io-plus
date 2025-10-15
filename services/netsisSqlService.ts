/**
 * Netsis SQL Socket Service
 * Angular servisinden React Native'e uyarlandı
 * TanStack Query ile kullanım için optimize edildi
 */

import {
  TErpBalanceList,
  TNetsisAccount,
  TNetsisBalance,
  TNetsisDocumentDetail,
  TNetsisInvoice,
  TNetsisMuhPivot,
  TNetsisStockBalance,
  TNetsisTransaction,
} from '../types/netsis.types';

/**
 * SQL Service Interface - Backend'de implement edilmesi gereken servis
 * Bu servis HTTP üzerinden SQL sorgularını çalıştırır
 */
interface SqlServiceClient {
  executeSql<T = any>(sql: string): Promise<T>;
}

export class NetsisSqlService {
  private sqlClient: SqlServiceClient;

  constructor(sqlClient: SqlServiceClient) {
    this.sqlClient = sqlClient;
  }

  /**
   * Faturaları getir
   */
  async getInvoices(year: string | number, company: string): Promise<TNetsisInvoice[]> {
    const sql = `select * from netsissvr.${company}${year}.dbo.TBLFATUIRS WHERE FTIRSIP = 2 order by TARIH`;
    const sql2 = `select * from netsissvr.${company}${year}.dbo.TBLFATUEK`;

    const [invoices, invoiceDetails] = await Promise.all([
      this.sqlClient.executeSql<TNetsisInvoice[]>(sql),
      this.sqlClient.executeSql<any[]>(sql2),
    ]);

    // Fatura detaylarını ana faturalara ekle
    return invoices.map(invoice => {
      const detail = invoiceDetails.find(d => d.FATIRSNO === invoice.FATIRS_NO);
      return {
        ...invoice,
        alt: detail,
      };
    });
  }

  /**
   * Cari hesapları getir
   */
  async getAccounts(year: string | number, company: string): Promise<TNetsisAccount[]> {
    const sql = `select CARI_KOD ID, dbo.trk(CARI_ISIM) name from netsissvr.${company}${year}.dbo.TBLCASABIT`;
    console.log('SQL:', sql);
    return this.sqlClient.executeSql<TNetsisAccount[]>(sql);
  }

  /**
   * Cari hareketlerini getir
   */
  async getTransactions(
    accountId: string,
    year: string | number,
    company: string
  ): Promise<TNetsisTransaction[]> {
    const sql = `select * from netsissvr.${company}${year}.dbo.TBLCAHAR where CARI_KOD = '${accountId}'`;
    console.log('SQL:', sql);
    return this.sqlClient.executeSql<TNetsisTransaction[]>(sql);
  }

  /**
   * Muhasebe hareketlerini getir
   */
  async getMuhTransactions(
    accountId: string,
    year: string | number,
    company: string
  ): Promise<TNetsisTransaction[]> {
    const sql = `select TARIH, dbo.trk(ACIKLAMA) ACIKLAMA, BORC, ALACAK, BELGE_NO, HAREKET_TURU from netsissvr.${company}${year}.dbo.TBLCAHAR where CARI_KOD = '${accountId}'`;
    console.log('SQL:', sql);
    return this.sqlClient.executeSql<TNetsisTransaction[]>(sql);
  }

  /**
   * Hesap bakiyesini getir
   */
  async getBalance(
    accountId: string,
    year: string | number,
    company: string
  ): Promise<number> {
    const sql = `select sum(BORC) - sum(ALACAK) BAKIYE from netsissvr.${company}${year}.dbo.TBLCAHAR where CARI_KOD = '${accountId}'`;
    console.log('SQL:', sql);
    const result = await this.sqlClient.executeSql<TNetsisBalance[]>(sql);
    return result[0]?.BAKIYE || 0;
  }

  /**
   * Tüm hesapların bakiyelerini getir
   */
  async getAllBalances(year: string | number, company: string): Promise<TNetsisBalance[]> {
    const sql = `select CARI_KOD, sum(BORC) - sum(ALACAK) BAKIYE from netsissvr.${company}${year}.dbo.TBLCAHAR Group by CARI_KOD`;
    console.log('SQL:', sql);
    return this.sqlClient.executeSql<TNetsisBalance[]>(sql);
  }

  /**
   * Belge detayını getir
   */
  async getDocumentDetail(
    year: string | number,
    documentId: string,
    company: string
  ): Promise<TNetsisDocumentDetail[]> {
    const sql = `SELECT STOK_KODU,dbo.TRK(CASE WHEN EKALAN_NEDEN=1 THEN EKALAN ELSE
      (SELECT TOP 1 STOK_ADI FROM NETSISSVR.VERI${year}.dbo.TBLSTSABIT WHERE STOK_KODU=TBLSTHAR.STOK_KODU) END) AS STOK_ADI,
      STHAR_KDV,CONVERT(FLOAT,STHAR_GCMIK) AS MIKTAR,CONVERT(FLOAT,STHAR_DOVFIAT) AS DOV_FIYAT,
      (SELECT TOP 1 ISIM FROM NETSISSVR.NETSIS.dbo.KUR WHERE BIRIM=TBLSTHAR.STHAR_DOVTIP) AS DOVIZ,CONVERT(MONEY,STHAR_BF) AS BIRIM_FIYAT,
      CONVERT(MONEY,STHAR_BF*STHAR_GCMIK) AS TOPLAM FROM NETSISSVR.${company}${year}.dbo.TBLSTHAR WHERE FISNO='${documentId}' ORDER BY SIRA`;
    console.log('SQL:', sql);
    return this.sqlClient.executeSql<TNetsisDocumentDetail[]>(sql);
  }

  /**
   * Cari borç yaşlandırma raporu (Stored Procedure)
   */
  async getCariBorcYas(year: string | number, company: string): Promise<TErpBalanceList[]> {
    const sql = `EXECUTE NETSISSVR.${company}${year}.dbo.SP_CARI_BORC_YAS`;
    console.log('SQL:', sql);
    return this.sqlClient.executeSql<TErpBalanceList[]>(sql);
  }

  /**
   * Stok listesini getir
   */
  async getStocks(company: string = 'VERI2022'): Promise<TNetsisStockBalance[]> {
    const sql = `SELECT * FROM NETSISSVR.${company}.dbo.CLD_STOK_LIST`;
    console.log('SQL:', sql);
    return this.sqlClient.executeSql<TNetsisStockBalance[]>(sql);
  }

  /**
   * Muhasebe pivot raporu - Gider hesapları
   */
  async getMuhPivotOutcome(company: string): Promise<TNetsisMuhPivot[]> {
    const sql = `select LEFT (HES_KOD,3) AS ANA_HESAP,
    (SELECT HS_ADI FROM netsissvr.${company}.dbo.TBLMUPLAN AS ANA 
    WHERE ANA.HESAP_KODU=LEFT(TBLMUHFIS.HES_KOD,3)) AS ANAHESAP_ADI, 
    LEFT (HES_KOD,6) AS GRUP1, 
    DBO.TRK((SELECT HS_ADI FROM netsissvr.${company}.dbo.TBLMUPLAN AS GRUP1 
    WHERE GRUP1.HESAP_KODU=LEFT (TBLMUHFIS.HES_KOD,6))) AS GRUP1_ISIM, 
    LEFT (HES_KOD,9) AS GRUP2,HES_KOD, 
    DBO.TRK((SELECT HS_ADI FROM netsissvr.${company}.dbo.TBLMUPLAN AS GRUP1 
    WHERE GRUP1.HESAP_KODU=TBLMUHFIS.HES_KOD)) AS HESAP_ADI,
    AY_KODU, FISNO,SIRA,HES_KOD,TARIH,BA,DBO.TRK(ACIKLAMA) ACIKLAMA, 
    case when BA=2 THEN TUTAR ELSE  (TUTAR * -1) END 
    TUTAR,MIKTAR,EVRAKTARIHI,ENTEGREFKEY,ISLEMTIPI,dbo.TRK(PROJE_KODU) as PK, 
    KAYITTARIHI from netsissvr.${company}.dbo.TBLMUHFIS where LEFT (HES_KOD,3) in 
    ('740','750','760','770','780','790')`;

    console.log('SQL (muhPivotOutcome):', sql);
    return this.sqlClient.executeSql<TNetsisMuhPivot[]>(sql);
  }

  /**
   * Muhasebe pivot raporu - Tüm hesaplar
   */
  async getMuhPivot(company: string): Promise<TNetsisMuhPivot[]> {
    const sql = `select LEFT (HES_KOD,3) AS ANA_HESAP,
    (SELECT HS_ADI FROM netsissvr.${company}.dbo.TBLMUPLAN AS ANA WHERE ANA.HESAP_KODU=LEFT(TBLMUHFIS.HES_KOD,3)) AS ANAHESAP_ADI,
    LEFT (HES_KOD,6) AS GRUP1,
    DBO.TRK((SELECT HS_ADI FROM netsissvr.${company}.dbo.TBLMUPLAN AS GRUP1 WHERE GRUP1.HESAP_KODU=LEFT (TBLMUHFIS.HES_KOD,6))) AS GRUP1_ISIM,
    LEFT (HES_KOD,9) AS GRUP2,
    HES_KOD,
    DBO.TRK((SELECT HS_ADI FROM netsissvr.${company}.dbo.TBLMUPLAN AS GRUP1 WHERE GRUP1.HESAP_KODU=TBLMUHFIS.HES_KOD)) AS HESAP_ADI,
    AY_KODU, FISNO,SIRA,HES_KOD,TARIH,BA,DBO.TRK(ACIKLAMA) ACIKLAMA,case when BA=2 THEN TUTAR ELSE  (TUTAR * -1) END TUTAR,MIKTAR,EVRAKTARIHI,ENTEGREFKEY,ISLEMTIPI,dbo.TRK(PROJE_KODU) as PK, KAYITTARIHI from netsissvr.${company}.dbo.TBLMUHFIS`;

    console.log('SQL (muhPivot):', sql);
    return this.sqlClient.executeSql<TNetsisMuhPivot[]>(sql);
  }
}

/**
 * HTTP Client üzerinden SQL sorguları çalıştıran adapter
 */
export class HttpSqlClient implements SqlServiceClient {
  private baseUrl: string;
  private apiKey?: string;
  private token?: string;

  constructor(baseUrl: string, apiKey?: string, token?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.token = token;
  }

  async executeSql<T = any>(sql: string): Promise<T> {
    try {
       
        const url = this.baseUrl + '/sql/';
        console.log('url:', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'x-api-key': this.apiKey }),
          ...(this.token && { 'x-user-token': this.token }),
        },
        body: JSON.stringify({action: 'sql', sql}),
      });

      if (!response.ok) {
        throw new Error(`SQL execution failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('SQL execution error:', error);
      throw error;
    }
  }
}

/**
 * Netsis SQL servis instance'ı oluştur
 */
export function createNetsisSqlService(
  sqlServiceUrl: string,
  apiKey?: string,
  token?: string
): NetsisSqlService {
  const sqlClient = new HttpSqlClient(sqlServiceUrl, apiKey, token);
  return new NetsisSqlService(sqlClient);
}

