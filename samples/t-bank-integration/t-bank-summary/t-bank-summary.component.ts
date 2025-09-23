import { Component, Input, OnChanges, OnInit, SimpleChanges, DoCheck, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxChartModule } from 'devextreme-angular';
import { TBankTransactions } from '../t-bank.model';
import { TBankIntegrationService } from '../t-bank-integration.service';
import { endOfDay, startOfDay } from 'date-fns';

interface BankSummary {
  bankAccId: string;
  bankAccName: string;
  inflow: number;
  outflow: number;
  balance: number;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

@Component({
  selector: 'app-t-bank-summary',
  templateUrl: './t-bank-summary.component.html',
  styleUrls: ['./t-bank-summary.component.css'],
  standalone: true,
  imports: [CommonModule, DxChartModule]
})
export class TBankSummaryComponent implements OnInit, OnChanges, DoCheck {
  @Input() dateRange: DateRange = {
    startDate: startOfDay(new Date()),
    endDate: endOfDay(new Date())
  };
  
  bankSummaries: BankSummary[] = [];
  totalInflow = 0;
  totalOutflow = 0;
  totalBalance = 0;
  filteredTransactions: TBankTransactions[] = [];
  private previousStartDate: Date | null = null;
  private previousEndDate: Date | null = null;
  private lastDataCount = 0;

  constructor(
    public banksocketService: TBankIntegrationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('TBankSummary - ngOnInit çalıştı');
    this.calculateSummary();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('TBankSummary - ngOnChanges çalıştı', changes);
    // Özellikle dateRange değişikliğini izle
    if (changes['dateRange']) {
      console.log('TBankSummary - dateRange değişti:', 
        changes['dateRange'].previousValue, ' -> ', changes['dateRange'].currentValue);
      this.calculateSummary();
    }
  }

  ngDoCheck(): void {
    // Tarih değişikliğini kontrol et (referans değişmeden içerik değişirse)
    const startDateChanged = this.previousStartDate !== this.dateRange?.startDate;
    const endDateChanged = this.previousEndDate !== this.dateRange?.endDate;
    
    // Veri sayısı değişimini kontrol et
    const dataChanged = this.lastDataCount !== (this.banksocketService.items()?.length || 0);
    
    if (startDateChanged || endDateChanged || dataChanged) {
      console.log('TBankSummary - değişiklik algılandı:', {
        startDateChanged,
        endDateChanged,
        dataChanged,
        previousDataCount: this.lastDataCount,
        currentDataCount: this.banksocketService.items()?.length || 0
      });
      
      this.previousStartDate = this.dateRange?.startDate || null;
      this.previousEndDate = this.dateRange?.endDate || null;
      this.lastDataCount = this.banksocketService.items()?.length || 0;
      
      this.calculateSummary();
      // Değişikliklerin görüntüye yansıması için
      this.cdr.detectChanges();
    }
  }

  calculateSummary(): void {
    console.log('TBankSummary - calculateSummary çalıştı', 
      'startDate:', this.dateRange?.startDate, 
      'endDate:', this.dateRange?.endDate);
    
    // Sıfırlama
    this.bankSummaries = [];
    this.totalInflow = 0;
    this.totalOutflow = 0;
    this.totalBalance = 0;
    
    // Tüm banka işlemleri
    const allTransactions = this.banksocketService.items();
    
    if (!allTransactions || allTransactions.length === 0) {
      console.log('TBankSummary - Veri bulunamadı');
      return;
    }

    console.log('TBankSummary - Toplam işlem:', allTransactions.length);

    // Tarih aralığına göre filtrele
    this.filteredTransactions = allTransactions.filter(transaction => {
      if (!this.dateRange?.startDate || !this.dateRange?.endDate) {
        return true; // Tarih filtreleri ayarlanmamışsa tüm kayıtları göster
      }
      
      const transactionDate = new Date(transaction.businessDate);
      return transactionDate >= this.dateRange.startDate && 
             transactionDate <= this.dateRange.endDate;
    });
    
    console.log('TBankSummary - Filtrelenmiş işlem:', this.filteredTransactions.length);
    
    if (this.filteredTransactions.length === 0) {
      return;
    }

    // Bankalar için geçici özet veriler
    const tempSummaries = new Map<string, BankSummary>();
    
    // Banka hesapları listesi
    const bankAccounts = this.banksocketService.bankAccounts || [];
    
    // İşlemleri döngüyle gezerek her banka için toplam değerleri hesapla
    this.filteredTransactions.forEach(transaction => {
      if (!tempSummaries.has(transaction.bankAccId)) {
        const bankAccount = bankAccounts.find(acc => acc.bankAccId === transaction.bankAccId);
        tempSummaries.set(transaction.bankAccId, {
          bankAccId: transaction.bankAccId,
          bankAccName: bankAccount ? bankAccount.bankAccName : transaction.bankAccId,
          inflow: 0,
          outflow: 0,
          balance: 0
        });
      }
      
      const summary = tempSummaries.get(transaction.bankAccId);
      if (transaction.amount > 0) {
        summary.inflow += transaction.amount;
        this.totalInflow += transaction.amount;
      } else {
        summary.outflow += Math.abs(transaction.amount);
        this.totalOutflow += Math.abs(transaction.amount);
      }
      
      summary.balance += transaction.amount;
      this.totalBalance += transaction.amount;
    });
    
    // Map'ten dizi oluştur
    this.bankSummaries = Array.from(tempSummaries.values());
    console.log('TBankSummary - Banka sayısı:', this.bankSummaries.length);
  }
} 