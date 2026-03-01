/**
 * הגדרת משתמש כאדמין (Custom Claim)
 * הרצה: node set-admin.js <UID>
 *
 * דרוש: קובץ Service Account
 * 1. Firebase Console → Project Settings → Service Accounts
 * 2. Generate new private key → שמור כ-service-account.json בתיקיית functions
 * 3. הוסף service-account.json ל-.gitignore
 */
const admin = require('firebase-admin')
const path = require('path')

const uid = process.argv[2]
if (!uid) {
  console.error('שימוש: node set-admin.js <UID>')
  process.exit(1)
}

if (!admin.apps.length) {
  const serviceAccount = path.join(__dirname, 'service-account.json')
  try {
    admin.initializeApp({ credential: admin.credential.cert(require(serviceAccount)) })
  } catch (e) {
    console.error('שגיאה: לא נמצא service-account.json. הורד מ-Firebase Console → Project Settings → Service Accounts')
    process.exit(1)
  }
}

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log('הוגדר אדמין בהצלחה:', uid)
    process.exit(0)
  })
  .catch((err) => {
    console.error('שגיאה:', err.message)
    process.exit(1)
  })
