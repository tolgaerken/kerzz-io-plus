   private readonly smartyUrl = 'https://smarty.kerzz.com:4004';
  private readonly apiKey = '1453';
  private readonly adminEmail = 'tolga@kerzz.com';
  private readonly adminPhone = '05323530566';
  private readonly adminName = 'Tolga Erken';
  
  
  async sendEmail(name: string, email: string, subject: string, htmlContent: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.smartyUrl}/api/mail/sendBasicMail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apiKey': this.apiKey
        },
        body: JSON.stringify({
          personName: name,
          personMail: email,
          subject: subject,
          text: htmlContent
        })
      });

      if (!response.ok) {
        console.error('Email gönderme hatası:', response.statusText);
        return false;
      }

      console.log(`✅ Email başarıyla gönderildi: ${email}`);
      return true;
    } catch (error) {
      console.error('Email gönderme hatası:', error);
      return false;
    }
  }

  async sendSms(phone: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.smartyUrl}/api/sms/sendSms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apiKey': this.apiKey
        },
        body: JSON.stringify({
          gsm: phone,
          text: message
        })
      });

      if (!response.ok) {
        console.error('SMS gönderme hatası:', response.statusText);
        return false;
      }

      console.log(`✅ SMS başarıyla gönderildi: ${phone}`);
      return true;
    } catch (error) {
      console.error('SMS gönderme hatası:', error);
      return false;
    }
  }

  async sendSellerAssignmentNotification(
    seller: { name: string; mail: string; phone: string; fcmToken?: string },
    opportunity: {
      no: number;
      company: string;
      brand: string;
      request: string;
      name: string;
      phone: string;
      email: string;
      cityId: number;
      logs: Array<{ text: string; date: Date; userName: string }>;
    }
  ): Promise<void> {
    try {
      // HTML email içeriği hazırla
      const emailContent = this.buildEmailContent(opportunity);
      
      // SMS içeriği hazırla  
      const smsContent = `Yeni Talep Atamasi Yapildi, No: ${opportunity.no} Detaylar mail ile gonderildi`;

      // Push notification içeriği hazırla
      const pushNotification: PushNotificationData = {
        title: 'Yeni Talep Ataması',
        body: `${opportunity.no} nolu talep size atanmıştır - ${opportunity.company}`,
        data: {
          type: 'opportunity_assignment',
          opportunityNo: opportunity.no,
          opportunityId: opportunity.no.toString(),
        },
      };

      // Paralel olarak bildirimleri gönder
      const promises = [
        // Admin'e email gönder
        this.sendEmail(
          this.adminName,
          this.adminEmail,
          `${opportunity.no} - Yeni Talep Ataması (${opportunity.brand})`,
          emailContent
        ),
        
        // Temsilciye email gönder
        this.sendEmail(
          seller.name,
          seller.mail,
          `${opportunity.no} - Yeni Talep Ataması (${opportunity.brand})`,
          emailContent
        ),
        
        // Admin'e SMS gönder
        this.sendSms(this.adminPhone, smsContent),
        
        // Temsilciye SMS gönder
        this.sendSms(seller.phone, smsContent)
      ];

      // Push notification gönder (FCM token varsa)
      if (seller.fcmToken) {
        promises.push(this.sendPushNotification(seller.fcmToken, pushNotification));
      }

      const results = await Promise.allSettled(promises);
      
      // Sonuçları logla
      results.forEach((result, index) => {
        let type = 'Unknown';
        let recipient = 'Unknown';
        
        if (index < 2) {
          type = 'Email';
          recipient = index === 0 ? 'Admin' : 'Temsilci';
        } else if (index < 4) {
          type = 'SMS';
          recipient = index === 2 ? 'Admin' : 'Temsilci';
        } else {
          type = 'Push Notification';
          recipient = 'Temsilci';
        }
        
        if (result.status === 'rejected') {
          console.error(`❌ ${type} ${recipient} gönderimi başarısız:`, result.reason);
        }
      });

    } catch (error) {
      console.error('Temsilci atama bildirimi gönderme hatası:', error);
    }
  }

  private buildEmailContent(opportunity: {
    no: number;
    company: string;
    request: string;
    name: string;
    phone: string;
    email: string;
    cityId: number;
    logs: Array<{ text: string; date: Date; userName: string }>;
  }): string {
    let emailContent = `
      <p>${opportunity.no} nolu talep size atanmıştır</p>
      <p>Lütfen talep ile ilgili adımları log olarak kayda alınız.</p>
      <p></p>
      <h3>${opportunity.company}</h3>
      <p>${opportunity.request}</p>
      <p>Yetkili: ${opportunity.name}</p>
      <p>Telefon: ${opportunity.phone}</p>
      <p>Email: ${opportunity.email}</p>
      <p>İl: ${opportunity.cityId}</p>
    `;

    // Log kayıtlarını ekle
    if (opportunity.logs && opportunity.logs.length > 0) {
      let logsText = "";
      for (const log of opportunity.logs) {
        const dateStr = new Date(log.date).toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        logsText += `<div style='margin-top:20px'>${log.text}</div><div style='font-size:10px'>${log.userName} ${dateStr}</div>`;
      }
      
      if (logsText !== '') {
        emailContent += '<h3>Log Kayıtları</h3>' + logsText;
      }
    }

    return emailContent;
  }