const admin = require('firebase-admin')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { onCall, HttpsError } = require('firebase-functions/v2/https')

admin.initializeApp()
const db = admin.firestore()

/** האם היום ראש חודש עברי */
async function isRoshChodesh(date) {
  const { HDate } = await import('@hebcal/core')
  const h = new HDate(date)
  return h.getDate() === 1
}

/** שליחת התראה בתחילת חודש עברי – הזמנה למלא מטרות חודשיות */
exports.monthlyGoalsReminder = onSchedule(
  { schedule: '0 8 * * *', timeZone: 'Asia/Jerusalem' },
  async () => {
    const now = new Date()
    if (!(await isRoshChodesh(now))) return

    const usersSnap = await db.collection('users').get()
    const tokens = []
    for (const docSnap of usersSnap.docs) {
      const data = docSnap.data()
      const profile = data && data.profile
      const token = profile && profile.fcmToken
      if (token) tokens.push(token)
    }

    if (tokens.length === 0) return

    const message = {
      notification: {
        title: 'מטרות חודש חדש',
        body: 'הקדישי רגע לתכנון – מקצועי, אישי ולנפש',
      },
      data: { type: 'monthly_goals' },
      tokens,
    }

    try {
      await admin.messaging().sendEachForMulticast(message)
    } catch (err) {
      console.error('שגיאה בשליחת התראות מטרות חודש:', err)
    }
  }
)

/** שליחת התראת בדיקה – לשימוש בפיתוח/בדיקה בלבד */
exports.sendTestNotification = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'יש להתחבר כדי לשלוח התראת בדיקה')
  }
  const uid = request.auth.uid
  const userDoc = await db.collection('users').doc(uid).get()
  const data = userDoc.exists ? userDoc.data() : {}
  const profile = data && data.profile
  const token = profile && profile.fcmToken
  if (!token) {
    throw new HttpsError('failed-precondition', 'לא נמצא FCM token. וודאי שהרשמת להתראות בהגדרות.')
  }
  const message = {
    notification: {
      title: '🔔 התראת בדיקה',
      body: 'ההתראות פועלות! אפשר להסיר את כפתור הבדיקה.',
    },
    data: { type: 'test' },
    token,
  }
  try {
    await admin.messaging().send(message)
    return { success: true }
  } catch (err) {
    console.error('שגיאה בשליחת התראת בדיקה:', err)
    throw new HttpsError('internal', 'שליחת ההתראה נכשלה')
  }
})
