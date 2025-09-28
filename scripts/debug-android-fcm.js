#!/usr/bin/env node

/**
 * Android FCM Debug Script
 * Bu script Android FCM sorunlarını tespit etmek için kullanılır
 */

const fs = require('fs');
const path = require('path');

console.log('🤖 Android FCM Debug Script');
console.log('============================');

// 1. Package.json kontrolü
console.log('\n📦 Package.json Firebase Bağımlılıkları:');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const firebaseDeps = Object.keys(packageJson.dependencies || {})
    .filter(dep => dep.includes('firebase'))
    .reduce((acc, dep) => {
      acc[dep] = packageJson.dependencies[dep];
      return acc;
    }, {});
  
  console.log(JSON.stringify(firebaseDeps, null, 2));
} else {
  console.log('❌ package.json bulunamadı');
}

// 2. Google Services dosyası kontrolü
console.log('\n🔧 Google Services Dosyası:');
const googleServicesPath = path.join(__dirname, '..', 'android', 'app', 'google-services.json');
if (fs.existsSync(googleServicesPath)) {
  try {
    const googleServices = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
    console.log('✅ google-services.json mevcut');
    console.log(`📱 Project ID: ${googleServices.project_info?.project_id || 'N/A'}`);
    console.log(`📱 Package Name: ${googleServices.client?.[0]?.client_info?.android_client_info?.package_name || 'N/A'}`);
    console.log(`🔑 App ID: ${googleServices.client?.[0]?.client_info?.mobilesdk_app_id || 'N/A'}`);
  } catch (error) {
    console.log('❌ google-services.json parse hatası:', error.message);
  }
} else {
  console.log('❌ google-services.json bulunamadı');
}

// 3. Android Manifest kontrolü
console.log('\n📋 Android Manifest Kontrolü:');
const manifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  const manifest = fs.readFileSync(manifestPath, 'utf8');
  
  // İzin kontrolü
  const hasPostNotifications = manifest.includes('POST_NOTIFICATIONS');
  const hasInternet = manifest.includes('android.permission.INTERNET');
  const hasVibrate = manifest.includes('android.permission.VIBRATE');
  
  console.log(`✅ INTERNET izni: ${hasInternet ? 'Var' : 'Yok'}`);
  console.log(`✅ VIBRATE izni: ${hasVibrate ? 'Var' : 'Yok'}`);
  console.log(`✅ POST_NOTIFICATIONS izni: ${hasPostNotifications ? 'Var' : 'Yok'}`);
  
  // Firebase service kontrolü
  const hasMessagingService = manifest.includes('ReactNativeFirebaseMessagingService');
  const hasMessagingReceiver = manifest.includes('ReactNativeFirebaseMessagingReceiver');
  
  console.log(`🔥 Firebase Messaging Service: ${hasMessagingService ? 'Var' : 'Yok'}`);
  console.log(`🔥 Firebase Messaging Receiver: ${hasMessagingReceiver ? 'Var' : 'Yok'}`);
  
  // Meta-data kontrolü
  const hasDefaultChannel = manifest.includes('com.google.firebase.messaging.default_notification_channel_id');
  const hasDefaultIcon = manifest.includes('com.google.firebase.messaging.default_notification_icon');
  const hasDefaultColor = manifest.includes('com.google.firebase.messaging.default_notification_color');
  
  console.log(`🎨 Default Notification Channel: ${hasDefaultChannel ? 'Var' : 'Yok'}`);
  console.log(`🎨 Default Notification Icon: ${hasDefaultIcon ? 'Var' : 'Yok'}`);
  console.log(`🎨 Default Notification Color: ${hasDefaultColor ? 'Var' : 'Yok'}`);
} else {
  console.log('❌ AndroidManifest.xml bulunamadı');
}

// 4. Build.gradle kontrolü
console.log('\n🔨 Build.gradle Kontrolü:');
const buildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
if (fs.existsSync(buildGradlePath)) {
  const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
  
  const hasGoogleServices = buildGradle.includes('com.google.gms.google-services');
  console.log(`🔧 Google Services Plugin: ${hasGoogleServices ? 'Var' : 'Yok'}`);
} else {
  console.log('❌ build.gradle bulunamadı');
}

// 5. Root build.gradle kontrolü
console.log('\n🔨 Root Build.gradle Kontrolü:');
const rootBuildGradlePath = path.join(__dirname, '..', 'android', 'build.gradle');
if (fs.existsSync(rootBuildGradlePath)) {
  const rootBuildGradle = fs.readFileSync(rootBuildGradlePath, 'utf8');
  
  const hasGoogleServicesClasspath = rootBuildGradle.includes('com.google.gms:google-services');
  console.log(`🔧 Google Services Classpath: ${hasGoogleServicesClasspath ? 'Var' : 'Yok'}`);
} else {
  console.log('❌ Root build.gradle bulunamadı');
}

console.log('\n💡 Öneriler:');
console.log('1. Uygulamayı tamamen kapatıp yeniden açın');
console.log('2. Android cihazında Ayarlar > Uygulamalar > [Uygulama] > Bildirimler aktif mi kontrol edin');
console.log('3. Firebase Console\'da FCM ayarları kontrol edin');
console.log('4. Test notification göndermek için Firebase Console > Cloud Messaging kullanın');
console.log('5. Logcat\'te Firebase ve FCM loglarını kontrol edin: adb logcat | grep -i firebase');

console.log('\n🧪 Test Komutları:');
console.log('# Android logları izleme:');
console.log('adb logcat | grep -E "(Firebase|FCM|ReactNativeFirebase)"');
console.log('');
console.log('# Uygulama logları:');
console.log('adb logcat | grep -i "kerzz"');
console.log('');
console.log('# Notification test (Firebase Console kullanın):');
console.log('1. Firebase Console > Project > Cloud Messaging');
console.log('2. "Send your first message" tıklayın');
console.log('3. Notification title ve body girin');
console.log('4. Target olarak "Single device" seçin');
console.log('5. FCM registration token girin (uygulamadan alın)');

console.log('\n✅ Debug script tamamlandı!');
