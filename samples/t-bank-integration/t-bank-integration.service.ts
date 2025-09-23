import { inject, Injectable } from '@angular/core';
import { TBaseMongoService } from '../../t-extendibles/services/t-base-mongo.service';
import { TToastService } from '../../t-tools/t-toast/toast.service';
import { TBankAccount, TBankErpMapping, TBankTransactions } from './t-bank.model';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TBankIntegrationService extends TBaseMongoService<TBankTransactions> {

  url = "https://smarty.kerzz.com:4004"
  bankAccounts: TBankAccount[] = []
  bankErpMappins: TBankErpMapping[] = []

  private toast = inject(TToastService);
  private cpipe = inject(CurrencyPipe);
  private datePipe = inject(DatePipe);
  private _http = inject(HttpClient);

  constructor() {
    super("kerzz-contract", "bank-transactions");
    this.registerSocketUpdates();
    this.onSocketUpdates.subscribe((data) => {

      if (data?.operationType === "insert") {

        const bankTransaction: TBankTransactions = data.fullDocument
        const formattedAmount = this.cpipe.transform(bankTransaction.amount, '₺');
        const formateedDate = this.datePipe.transform(bankTransaction.createDate, 'dd/MM/yyyy hh:mm:ss');
        const formattedBalance = this.cpipe.transform(bankTransaction.balance, '₺');
        let text = ""
        if (bankTransaction.amount > 0) {

          text = `<div><span style="font-size: 24px">${formattedAmount}</span> Para Girişi</div>
          <div>Gönderen: ${bankTransaction.name}</div>
          <div>Açıklama: ${bankTransaction.description}</div>
          <div>Bakiye: ${formattedBalance}</div>
          <div style="font-size=12px">${formateedDate}</div>
          `

        } else {


          text = `<div><span style="font-size: 24px">${formattedAmount}</span> Para Çıkışı</div>
          <div>Alıcı: ${bankTransaction.name}</div>
          <div>Açıklama: ${bankTransaction.description}</div>
          <div>Bakiye: ${formattedBalance}</div>
          <div style="font-size=12px">${formateedDate}</div>`

        }

        // this.toast.show({
        //   title: bankTransaction.bankAccName,
        //   date: formateedDate,
        //   userName: "Banka Entegrasyonu",
        //   message: text,
        //   type: "info",
        //   position: "bottom-left",
        //   duration: -1
        // });
      }

    });
  }

    getErpBanks() {
      return new Promise((resolve, reject) => {
        let httpOptions = {
          headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json', 'apiKey': "1453" })
        }
        this._http.post(`${this.url}/erp/getErpBankMaps`, {}, httpOptions).subscribe((o: any) => {
          this.bankAccounts = o
          console.log("banks", o)
          resolve(o)
        }, e => {
          console.log(e)
          reject(e.error.message)
        })
      })
    }


    


}
