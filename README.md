# יומנטור - Yomentor

אפליקציית PWA ליומן אישי ואימון למורים ישראלים.

---

## 1. הרצה מקומית (פיתוח)

```bash
npm install
```

העתק את `.env.example` ל-`.env` ומלא את ערכי Firebase (ראה למטה).

```bash
npm run dev
```

האפליקציה תיפתח ב-`http://localhost:5173` (או פורט אחר).

---

## 2. פריסה ל-WEB (Production)

### א. בנייה

```bash
npm run build
```

הקבצים ייווצרו בתיקיית `dist/`.

### ב. Firebase Hosting (מומלץ – כי משתמשים ב-Firebase)

1. התקן Firebase CLI: `npm install -g firebase-tools`
2. התחבר: `firebase login`
3. אתחל Hosting: `firebase init hosting`
   - בחר את הפרויקט הקיים
   - Public directory: `dist`
   - Single-page app: `Yes`
   - Don't overwrite index.html
4. פרוס: `firebase deploy`

האפליקציה תהיה זמינה ב-`https://YOUR-PROJECT.web.app`

### ג. Netlify / Vercel

- **Netlify:** גרור את תיקיית `dist` ל-[netlify.com/drop](https://app.netlify.com/drop) או חבר ל-Git
- **Vercel:** `npx vercel dist` או חבר ל-Git

חשוב: הגדר את משתני הסביבה (Firebase) ב-dashboard של השירות.

---

## 3. שימוש כ-PWA (Add to Home Screen)

1. פתח את האפליקציה בדפדפן (Chrome/Edge) – מקומי או מפריסה
2. אחרי שמירה ראשונה ביומן, יופיע prompt "הוספה למסך הבית"
3. או: תפריט הדפדפן (⋮) → "התקן אפליקציה" / "Add to Home Screen"
4. האפליקציה תיפתח במצב standalone, עם אייקון במסך הבית

---

## הגדרת Firebase

1. צור פרויקט ב-[Firebase Console](https://console.firebase.google.com)
2. הפעל: **Authentication** (Anonymous), **Firestore**, **Storage**, **Cloud Messaging**
3. העתק: `cp .env.example .env`
4. מלא ב-`.env` את הערכים מ-Firebase Console:
   - Project Settings → General → Your apps → Web app
   - Cloud Messaging → Web Push certificates → VAPID key
5. העלה את `firestore.rules` ל-Firestore (Rules tab)

---

## הגדרת אדמין

כדי לאפשר יצירת סטים, יש להגדיר Custom Claim `admin: true` למשתמש.
דוגמה עם Firebase Admin SDK:

```javascript
admin.auth().setCustomUserClaims(uid, { admin: true })
```

---

## לוגו

הלוגו של פסג"ה מעלה אדומים נמצא ב-`public/logo-pisga.png`.
