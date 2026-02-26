# יומנטור - Yomentor

אפליקציית PWA ליומן אישי ואימון למורים ישראלים.

## התקנה

```bash
npm install
```

## הגדרת Firebase

1. צור פרויקט ב-[Firebase Console](https://console.firebase.google.com)
2. הפעל: Authentication (Anonymous), Firestore, Storage, Cloud Messaging
3. העתק את `.env.example` ל-`.env` ומלא את ערכי Firebase
4. העלה את `firestore.rules` ל-Firestore

## הרצה

```bash
npm run dev
```

## בנייה

```bash
npm run build
```

## הגדרת אדמין

כדי לאפשר יצירת סטים, יש להגדיר Custom Claim `admin: true` למשתמש.
דוגמה עם Firebase Admin SDK:

```javascript
admin.auth().setCustomUserClaims(uid, { admin: true })
```

## לוגו

הלוגו של פסג"ה מעלה אדומים נמצא ב-`public/logo-pisga.png`.
