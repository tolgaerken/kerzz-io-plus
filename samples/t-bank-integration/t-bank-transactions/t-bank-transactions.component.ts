import { Component, OnInit, ViewChild } from '@angular/core';
import { DxButtonModule, DxDataGridComponent, DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxSelectBoxModule } from 'devextreme-angular';
import { TBankErpMapping, TBankTransactions, TErpStatus } from '../t-bank.model';
import { TBankIntegrationService } from '../t-bank-integration.service';
import { endOfDay, endOfWeek, endOfYear, getYear, startOfDay, startOfWeek, startOfYear, subDays, subWeeks } from 'date-fns';
import { TErpTransactionsService } from '../../../t-erp/t-erp-transactions/t-erp-transactions.service';
import { TBankSummaryComponent } from '../t-bank-summary/t-bank-summary.component';
import { TGridAccountBalanceButtonComponent } from '../../../t-tools/t-grid-account-balance-button/t-grid-account-balance-button.component';
import { TErpAccounts, TErpGlAccounts } from '../../../t-erp/t-erp-transactions/t-erp.model';

@Component({
  selector: 'app-t-bank-transactions',
  templateUrl: './t-bank-transactions.component.html',
  styleUrls: ['./t-bank-transactions.component.css'],
  standalone: true,
  imports: [
    DxSelectBoxModule, 
    DxDataGridModule, 
    DxButtonModule, 
    DxDropDownBoxModule, 
    DxDateBoxModule,
    TBankSummaryComponent,
    TGridAccountBalanceButtonComponent
  ],
})
export class TBankTransactionsComponent implements OnInit {

  @ViewChild('bankSocketGrid') grid: DxDataGridComponent
  dropDownOptions: object;
  editorOptions: object;
  selectedRows = []
  selectedStatus = "waiting"
  selectedCompany = "VERI" + getYear(new Date()).toString()
  filteredTransactions: TBankTransactions[] = []
  
  // Gizlenecek banka hesap ID'leri
  excludedBankAccIds = ['7505','8093','7420','7507','7511']
  //excludedBankAccIds = ['7505','8093','7420','7507','7511']
  // Tarih filtresi için değişkenler
  dateRange = {
    startDate: startOfDay(new Date()),
    endDate: endOfDay(new Date())
  }

  status = [
    { id: "waiting", name: 'Bekleyenler' },
    { id: "success", name: 'İşlenenler' },
    { id: "error", name: 'Hatalılar' }
  ]

  erpAccounts: TErpAccounts[] = []
  erpGlAccounts: TErpGlAccounts[] = []

  constructor(

    public netsisService: TErpTransactionsService, public banksocketService: TBankIntegrationService) {
    this.dropDownOptions = { width: 800 };

  }

  // Belirtilen bankAccId'leri filtreleyerek veriyi günceller
  updateFilteredBankTransactions() {
    const allItems = this.banksocketService.items() || [];
    this.filteredTransactions = allItems.filter(item => 
      !this.excludedBankAccIds.includes(item.bankAccId?.toString())
    );
  }

  ngOnInit(): void { 
    console.log('TBankTransactions - ngOnInit çalıştı');
    // Init çağrısı ile başlangıç verilerini yükle
    this.init();
  }

  ngAfterViewInit() {
    this.netsisService.loadErpCompanies()
    console.log(this.netsisService.erpCompanies)
    this.banksocketService.getErpBanks()

  }


  async init() {
    console.log('TBankTransactions - init çalıştı', this.dateRange);
    let filter: any = {
      businessDate: {} as any
    };
    
    // Sadece tarih değerleri varsa filtre kriterlerine ekle
    if (this.dateRange.startDate) {
      filter.businessDate.$gte = startOfDay(this.dateRange.startDate);
    }
    
    if (this.dateRange.endDate) {
      filter.businessDate.$lte = endOfDay(this.dateRange.endDate);
    }
    
    // Eğer hiç tarih filtresi yoksa varsayılan olarak bugünü kullan
    if (!this.dateRange.startDate && !this.dateRange.endDate) {
      filter.businessDate.$gte = startOfDay(new Date());
      filter.businessDate.$lte = endOfDay(new Date());
    }

    //this.ChangeCompany(this.selectedCompany)

    if (this.erpAccounts.length == 0 || this.erpGlAccounts.length == 0) {
     this.getErpIDS() 
    }
    
    console.log('Veri filtrelemesi:', filter);
    await this.banksocketService.fetchData({ filter });
    console.log('Veri yüklendi, toplam:', this.banksocketService.items()?.length || 0);
    
    // Belirtilen bankAccId'leri filtrele
    this.updateFilteredBankTransactions();
  }

  // Tarih aralığı değiştiğinde çalışacak fonksiyon
  onDateRangeChanged(e) {
    console.log('onDateRangeChanged', e);
    
    // Daha sonra kullanabileceğimiz bir deep copy oluşturalım
    const prevDateRange = {...this.dateRange};
    
    // Eğer değer boşsa (temizle butonu kullanıldığında)
    if (e.value === null) {
      // Hangi tarih kutusunun değiştiğine bağlı olarak sıfırlama yapmak için event hedefini kontrol et
      if (e.element.id && e.element.id.includes('start')) {
        this.dateRange.startDate = null;
      } else {
        this.dateRange.endDate = null;
      }
    } else {
      // Değer varsa, normal şekilde güncelle
      if (e.element.id && e.element.id.includes('start')) {
        this.dateRange.startDate = e.value;
      } else {
        this.dateRange.endDate = e.value;
      }
    }
    
    // Yeni bir referans oluştur - Angular değişikliği tespit edebilsin
    this.dateRange = Object.assign({}, this.dateRange);
    
    console.log('dateRange updated:', this.dateRange);
    
    // Eğer her iki tarih de ayarlanmışsa, aramayı yenileme
    if (this.dateRange.startDate && this.dateRange.endDate) {
      this.Refresh();
    }
  }

  // Ön tanımlı tarih aralıklarını seçmek için fonksiyon
  selectDateRange(rangeType: string) {
    console.log('selectDateRange', rangeType);
    
    const today = new Date();
    
    // Yeni dateRange nesnesi oluştur - her zaman yeni bir referans kullan
    const newDateRange = {
      startDate: null,
      endDate: null
    };
    
    switch (rangeType) {
      case 'today':
        newDateRange.startDate = startOfDay(today);
        newDateRange.endDate = endOfDay(today);
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        newDateRange.startDate = startOfDay(yesterday);
        newDateRange.endDate = endOfDay(yesterday);
        break;
      case 'thisWeek':
        newDateRange.startDate = startOfWeek(today, { weekStartsOn: 1 });
        newDateRange.endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'lastWeek':
        const lastWeek = subWeeks(today, 1);
        newDateRange.startDate = startOfWeek(lastWeek, { weekStartsOn: 1 });
        newDateRange.endDate = endOfWeek(lastWeek, { weekStartsOn: 1 });
        break;
    }
    
    // dateRange için yeni bir nesne referansı oluştur 
    this.dateRange = newDateRange;
    
    console.log('selectDateRange: new dateRange:', this.dateRange);
    
    // Verileri yenile
    this.Refresh();
  }

  async getErpIDS() {

    

    this.erpAccounts = JSON.parse(localStorage.getItem("erpAccounts") ) || []
    this.erpGlAccounts = JSON.parse(localStorage.getItem("erpGlAccounts")) || []

    console.log("GetErpIDS", this.erpAccounts)

    const compnies = [
      {companyName: "VERI" + getYear(new Date()).toString(), companyId: "VERI" + getYear(new Date()).toString()},
      {companyName: "CLOUD" + getYear(new Date()).toString(), companyId: "CLOUD" + getYear(new Date()).toString()},
      {companyName: "MARKA" + getYear(new Date()).toString(), companyId: "MARKA" + getYear(new Date()).toString()},
      {companyName: "ETYA" + getYear(new Date()).toString(), companyId: "ETYA" + getYear(new Date()).toString()}
    ]


    let erpAccounts = []
    let erpGlAccounts = []
    try {

      for (const element of compnies) {
        console.log("GetErpIDS", element.companyId)
        erpAccounts.push(...await this.netsisService.loadErpAccounts(element.companyId))
        console.log("GetErpIDS", element.companyId, erpAccounts.length)
         // 5 saniye bekle
         await new Promise(resolve => setTimeout(resolve, 5000));
        console.log("GetErpIDS", element.companyId)
        erpGlAccounts.push(...await this.netsisService.loadErpGlAccounts(element.companyId))
        console.log("GetErpGLIDS", element.companyId, erpGlAccounts.length)
        // 5 saniye bekle
        await new Promise(resolve => setTimeout(resolve,5000));
      }
  
    } catch (error) {

      
      
    } finally {
      
      this.erpAccounts = erpAccounts
      this.erpGlAccounts = erpGlAccounts
      localStorage.setItem("erpAccounts", JSON.stringify(this.erpAccounts))
      localStorage.setItem("erpGlAccounts", JSON.stringify(this.erpGlAccounts))
    }
  

    // this.erpAccounts = await Promise.all(compnies.map(async (element) => {
    //   return await this.netsisService.loadErpAccounts(element.companyId);
    // })).then(results => results.flat());

    // localStorage.setItem("erpGlAccounts", JSON.stringify(this.erpGlAccounts))

    // this.erpAccounts = JSON.parse(localStorage.getItem("erpAccounts"))
    // this.erpGlAccounts = JSON.parse(localStorage.getItem("erpGlAccounts"))
    // })).then(results => results.flat());
    
    // this.erpGlAccounts = await Promise.all(compnies.map(async (element) => {
    //   return await this.netsisService.loadErpGlAccounts(element.companyId);
    // })).then(results => results.flat());


  }


  async ChangeCompany(e) {
return
    const compnies = [
      {companyName: "VERI" + getYear(new Date()).toString(), companyId: "VERI" + getYear(new Date()).toString()},
      {companyName: "CLOUD" + getYear(new Date()).toString(), companyId: "CLOUD" + getYear(new Date()).toString()},
      {companyName: "MARKA" + getYear(new Date()).toString(), companyId: "MARKA" + getYear(new Date()).toString()},
      {companyName: "ETYA" + getYear(new Date()).toString(), companyId: "ETYA" + getYear(new Date()).toString()}
    ]

    this.erpAccounts = await Promise.all(compnies.map(async (element) => {
      return await this.netsisService.loadErpAccounts(element.companyId);
    })).then(results => results.flat());
    
    this.erpGlAccounts = await Promise.all(compnies.map(async (element) => {
      return await this.netsisService.loadErpGlAccounts(element.companyId);
    })).then(results => results.flat());


  }

  loadGrid() {

    let firms = this.banksocketService.bankAccounts.filter(o => o.erpCompanyId == this.selectedCompany)
    let bankFirms: string[] = []
    for (const iterator of firms) {
      bankFirms.push(iterator.bankAccId)
    }

  }

  cellTemplate(container, options) {
    var noBreakSpace = "\u00A0",
      text = (options.value || []).map(element => {
        return options.column.lookup.calculateCellValue(element);
      }).join(", ");
    container.textContent = text || noBreakSpace;
    container.title = text;
  }

  calculateFilterExpression(filterValue, selectedFilterOperation, target) {
    if (target === "search" && typeof (filterValue) === "string") {
      return [(this as any).dataField, "contains", filterValue];
    }
    return function (data) {
      return (data.AssignedEmployee || []).indexOf(filterValue) !== -1
    }
  }


  onSelectionChanged(selectedRowKeys, cellInfo, dropDownBoxComponent) {
    cellInfo.setValue(selectedRowKeys[0]);
    if (selectedRowKeys.length > 0) {
      dropDownBoxComponent.close();
    }
  }




  async updatingRow(e) {
    await this.banksocketService.upsert(e.oldData.id, e.newData)
    // Filtrelenmiş verileri güncelle
    this.updateFilteredBankTransactions()
  }






  // async xupdatingRow(e) {

  //   if (e.newData.erpAccountCode) {
  //     this.grid.instance.beginCustomLoading("Kaydediliyor..")

  //     await this.banksocketService.upsert(e.oldData.id, e.newData)

  //     if (e.oldData.opponentIban && e.oldData.opponentIban !== "0") {

  //       let mapping: TBankErpMapping = {
  //         id: e.oldData.opponentIban,
  //         bankId: e.oldData.bankAccId,
  //         opponentIban: e.oldData.opponentIban,
  //         erpAccountCode: e.newData.erpAccountCode,
  //       }

  //       await this.banksocketService.saveErpBankMappings(mapping)
  //     }

  //     this.grid.instance.endCustomLoading()

  //   } else if (e.newData.erpGlAccountCode) {

  //     this.grid.instance.beginCustomLoading("Kaydediliyor..")

  //     await this.banksocketService.setTransactionErpAccCode(e.oldData.id, "", e.newData.erpGlAccountCode)

  //     if (e.oldData.opponentIban && e.oldData.opponentIban !== "0") {

  //       let mappingGL: TBankErpMapping = {
  //         id: e.oldData.opponentIban,
  //         bankId: e.oldData.bankAccId,
  //         opponentIban: e.oldData.opponentIban,
  //         erpGlAccountCode: e.newData.erpGlAccountCode,
  //       }

  //       await this.banksocketService.saveErpBankMappings(mappingGL)
  //     }

  //     this.grid.instance.endCustomLoading()

  //   }



  // }

  SaveErpTransaction(e) {
    // console.log(e)
    // this.banksocketService.saveErpBankTransaction(e.data.id)
  }

  contentReady(e) {

  }


  async Refresh(e?) {
    console.log('TBankTransactions - Refresh çalıştı', e);
    await this.init();
    
    // BankSummaryComponent'e değişiklikleri bildirmek için
    // bu noktada dateRange nesnesinin referansı değişmiş olmalı
    console.log('Refresh tamamlandı, özet bileşeni güncellenecek');
  }


  async Unlink(e) {
    // this.grid.instance.beginCustomLoading("Siliniyor..")
    // let data: TBankTransactions = e.data
    // e.data.erpAccountCode = ""
    // await this.banksocketService.setTransactionErpAccCode(e.data.id, "")

    // this.banksocketService.getErpBankMappings().then((o: TBankErpMapping[]) => {
    //   let id = o.find(o => o.opponentIban == data.opponentIban)
    //   if (id) {
    //     this.banksocketService.deleteErpBankMappings(id)
    //   }
    //   this.grid.instance.endCustomLoading()
    // })

  }


  async setStatus(e, s: TErpStatus) {
    if (e.data.erpStatus == "success") {
      return
    }
    e.data.erpStatus = s
   await this.banksocketService.upsert(e.data.id, {erpStatus: e.data.erpStatus})
   // Filtrelenmiş verileri güncelle
   this.updateFilteredBankTransactions()
  }


  onExporting(e) {
    // const workbook = new ExcelJS.Workbook();
    // const worksheet = workbook.addWorksheet('Payments');
    // exportDataGrid({
    //   component: e.component,
    //   worksheet: worksheet
    // }).then(function () {
    //   workbook.xlsx.writeBuffer().then(function (buffer) {
    //     saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'payments.xlsx');
    //   });
    // });
  }

  getSelectedCompany(data: TBankTransactions) {
    if (data.erpAccountCode) {
      return data.erpAccountCode.startsWith("M") ? "VERI" : "CLOUD" 
    }
    return "VERI" + getYear(new Date()).toString()
  }

}
