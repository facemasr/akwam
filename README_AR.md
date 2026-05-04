# تطبيق شورت سيريز WebView - جاهز كمشروع كامل

هذا مشروع Flutter كامل لتطبيق Android و iPhone يعرض موقعك داخل التطبيق:

https://shortseris.online/

## ماذا يحتوي المشروع؟

- كود Flutter كامل.
- مجلد Android جاهز.
- مجلد iOS مبدئي.
- WebView يعرض الموقع.
- تشغيل JavaScript.
- تشغيل الفيديو داخل التطبيق.
- أزرار رجوع / تقدم / الرئيسية / تحديث.
- شاشة عدم وجود إنترنت.
- فتح الروابط الخارجية خارج التطبيق.
- أيقونة تطبيق مبدئية.
- Splash داكن.
- واجهة عربية RTL.

## التشغيل

افتح المجلد في VS Code أو Android Studio ثم نفذ:

```bash
flutter pub get
flutter run
```

## بناء Android APK

```bash
flutter build apk --release
```

سيظهر الملف غالبًا في:

```text
build/app/outputs/flutter-apk/app-release.apk
```

## بناء Android AAB للمتجر

```bash
flutter build appbundle --release
```

سيظهر الملف غالبًا في:

```text
build/app/outputs/bundle/release/app-release.aab
```

## بناء iPhone

على جهاز Mac فقط:

```bash
flutter pub get
flutter build ios --release
```

ثم افتح:

```text
ios/Runner.xcworkspace
```

من Xcode واضبط Team و Bundle ID ثم Archive.

## تغيير رابط الموقع

افتح:

```text
lib/main.dart
```

وعدّل:

```dart
static const String websiteUrl = 'https://shortseris.online/';
static const String allowedHost = 'shortseris.online';
```

## ملاحظات مهمة

1. لا يمكن رفع تطبيق iPhone بدون حساب Apple Developer.
2. لا يمكن رفع Android على Google Play بدون توقيع Release Key.
3. التطبيق الحالي WebView كامل. أي تعديل في الموقع يظهر داخل التطبيق مباشرة.
4. موقعك يجب أن يعمل على HTTPS، وهذا موجود في الرابط الحالي.
5. قد ترفض Apple التطبيقات التي تعرض موقع فقط، لذلك عند النشر في App Store قد تحتاج إضافة مزايا Native مثل إشعارات أو صفحة مفضلة داخلية.