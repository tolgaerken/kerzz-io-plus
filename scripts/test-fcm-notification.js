#!/usr/bin/env node

/**
 * FCM Test Notification Script
 * Firebase Console üzerinden test notification gönderme rehberi
 */

console.log('🧪 FCM Test Notification Rehberi');
console.log('=================================');

console.log('\n📱 FCM Token Alma:');
console.log('1. Uygulamayı açın');
console.log('2. Console loglarında FCM token\'ı bulun:');
console.log('   "📱 FCM token alma sonucu: { hasToken: true, tokenLength: XXX }"');
console.log('3. Token\'ı kopyalayın (de6V8bVQTZW1KBP2Ydc9... ile başlayan)');

console.log('\n🔥 Firebase Console\'da Test:');
console.log('1. https://console.firebase.google.com/ adresine gidin');
console.log('2. Projenizi seçin (kerzz-io)');
console.log('3. Sol menüden "Cloud Messaging" seçin');
console.log('4. "Send your first message" butonuna tıklayın');

console.log('\n📝 Test Message Ayarları:');
console.log('Notification title: "Test Bildirimi"');
console.log('Notification text: "Bu bir test bildirimidir"');
console.log('Target: "Single device"');
console.log('FCM registration token: [Kopyaladığınız token]');

console.log('\n🎯 Advanced Options (Opsiyonel):');
console.log('- Android notification channel: "fcm_default_channel"');
console.log('- Priority: "High"');
console.log('- Sound: "default"');

console.log('\n🔍 Debug Komutları:');
console.log('# Gerçek zamanlı FCM logları:');
console.log('adb logcat | grep -E "(CustomFCMService|FirebaseMessaging|FCM)"');
console.log('');
console.log('# Notification logları:');
console.log('adb logcat | grep -i notification');
console.log('');
console.log('# Uygulama logları:');
console.log('adb logcat | grep -i "ReactNativeJS"');

console.log('\n✅ Başarı Kriterleri:');
console.log('1. Uygulama açıkken: Console\'da "🔔 FCM message alındı" mesajı');
console.log('2. Uygulama kapalıyken: Notification bar\'da bildirim görünür');
console.log('3. Logcat\'te: "CustomFCMService: FCM Message alındı" mesajı');

console.log('\n❌ Sorun Giderme:');
console.log('1. Token doğru kopyalandı mı?');
console.log('2. Cihaz internete bağlı mı?');
console.log('3. Google Play Services güncel mi?');
console.log('4. Uygulama bildirim izinleri aktif mi?');
console.log('5. Firebase Console\'da doğru proje seçildi mi?');

console.log('\n🔄 Yeniden Derleme:');
console.log('cd /Users/tolgaerken/Project/kerzz-io-plus');
console.log('expo run:android');

console.log('\n🎉 Test tamamlandıktan sonra sonuçları bildirin!');
