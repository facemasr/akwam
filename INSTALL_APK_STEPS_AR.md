# استخراج APK جاهز للتثبيت

## الخيار الأسرع: GitHub Actions

1. ارفع هذا المشروع إلى GitHub.
2. افتح تبويب Actions.
3. اختر workflow باسم:

Build Android APK

4. اضغط Run workflow.
5. بعد انتهاء البناء، حمّل الملف من Artifacts:

short-series-release-apk

ستجد داخله:

app-release.apk

هذا هو ملف التثبيت للأندرويد.

## التثبيت على هاتف Android

1. أرسل ملف app-release.apk إلى الهاتف.
2. افتحه من مدير الملفات.
3. فعّل خيار Install unknown apps إذا طلب الهاتف ذلك.
4. اضغط Install.

## بناء APK محليًا

إذا كان Flutter مثبتًا على جهازك:

```bash
flutter pub get
flutter build apk --release
```

الملف الناتج:

```text
build/app/outputs/flutter-apk/app-release.apk
```

## iPhone / IPA

ملف IPA لا يمكن إخراجه بدون:
- Mac
- Xcode
- Apple Developer Account
- Bundle ID
- Signing Certificate
- Provisioning Profile

بعد توفر هذه المتطلبات:

```bash
flutter build ipa --release
```

ثم يتم التثبيت عبر TestFlight أو Apple Configurator أو النشر على App Store.