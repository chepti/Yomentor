const admin = require('firebase-admin')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { onCall, HttpsError } = require('firebase-functions/v2/https')

admin.initializeApp()
const db = admin.firestore()
const projectId = process.env.GCLOUD_PROJECT || admin.app().options.projectId || 'yomentor-pz'
const baseUrl = `https://${projectId}.web.app`

/** האם היום ראש חודש עברי */
async function isRoshChodesh(date) {
  const { HDate } = await import('@hebcal/core')
  const h = new HDate(date)
  return h.getDate() === 1
}

/** תאריך ושעה נוכחיים בישראל */
function getIsraelNow() {
  const now = new Date()
  const str = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })
  const [y, m, d] = str.split('-').map(Number)
  const hour = parseInt(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem', hour: '2-digit', hour12: false }), 10)
  const minute = parseInt(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem', minute: '2-digit' }), 10)
  return { date: new Date(y, m - 1, d), hour, minute, dayOfWeek: new Date(y, m - 1, d).getDay() }
}

function parseStartDate(startedAt) {
  if (!startedAt) return null
  if (typeof startedAt.toDate === 'function') return startedAt.toDate()
  if (startedAt instanceof Date) return startedAt
  return null
}

/** חלון שאלה יומית נגמר אחרי N ימים מתאריך ההתחלה (יום 0 … N-1) */
function isSetDailyPeriodEnded(startedAt, totalQuestions) {
  if (!totalQuestions) return true
  const start = parseStartDate(startedAt)
  if (!start) return true
  const startDay = new Date(start)
  startDay.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((today.getTime() - startDay.getTime()) / (24 * 60 * 60 * 1000))
  return diffDays >= totalQuestions
}

/** יום ראשון של חודש עברי לפי מפתח (תואם ללקוח) */
function getHebrewMonthStartDate(HDate, monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  const hFirst = new HDate(1, m, y)
  const d = hFirst.greg()
  d.setHours(0, 0, 0, 0)
  return d
}

/** האם לשלוח התראה היום לפי workDays ו-density */
function shouldSendToday(workDays, density, dayOfWeek) {
  if (density === 'high') return true
  if (!workDays || !Array.isArray(workDays)) return false
  if (!workDays.includes(dayOfWeek)) return false
  if (density === 'medium') return true
  if (density === 'low') {
    const workDaysSorted = [...workDays].sort((a, b) => a - b)
    const idx = workDaysSorted.indexOf(dayOfWeek)
    return idx >= 0 && idx < 3
  }
  return false
}

/** התראה יומית לכתיבה + התראה כשיש סט פעיל */
exports.dailyWritingReminder = onSchedule(
  { schedule: '0,15,30,45 * * * *', timeZone: 'Asia/Jerusalem' },
  async () => {
    const { hour, minute, dayOfWeek } = getIsraelNow()
    const currentSlot = `${String(hour).padStart(2, '0')}:${String(Math.floor(minute / 15) * 15).padStart(2, '0')}`

    const usersSnap = await db.collection('users').get()
    const setsSnap = await db.collection('sets').get()
    const setsMap = Object.fromEntries(setsSnap.docs.map((d) => [d.id, { ...d.data(), id: d.id }]))

    const { HDate } = await import('@hebcal/core')
    const hNow = new HDate(new Date())
    const monthKey = `${hNow.getFullYear()}-${String(hNow.getMonth()).padStart(2, '0')}`

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id
      const data = userDoc.data()
      const profile = data?.profile
      const token = profile?.fcmToken
      if (!token) continue

      const reminderTime = profile?.reminderTime || '07:30'
      const [rh, rm] = reminderTime.slice(0, 5).split(':').map(Number)
      const reminderSlot = `${String(rh).padStart(2, '0')}:${String(Math.floor((rm || 0) / 15) * 15).padStart(2, '0')}`
      if (reminderSlot !== currentSlot) continue

      const workDays = profile?.workDays ?? [0, 1, 2, 3, 4]
      const density = profile?.reminderDensity || 'medium'
      if (!shouldSendToday(workDays, density, dayOfWeek)) continue

      let title = 'יומנטור – כתבי לעצמך'
      let body = 'רגע שקט ליומן – מה עובר עלייך היום?'
      let type = 'daily'
      let imageUrl = `${baseUrl}/logo-pisga.png`

      const activeSet = data?.activeSet
      let activeSetData = null

      if (activeSet?.setId) {
        const sd = setsMap[activeSet.setId]
        if (sd) {
          const n = (sd.questions && sd.questions.length) || 0
          if (!isSetDailyPeriodEnded(activeSet.startedAt, n)) {
            activeSetData = sd
          }
        }
      }

      let allowMonthlyFallback = true
      if (activeSet?.setId && !activeSetData) {
        const other = setsMap[activeSet.setId]
        const n = other && other.questions ? other.questions.length : 0
        if (!other || isSetDailyPeriodEnded(activeSet.startedAt, n)) {
          allowMonthlyFallback = false
        }
      }

      if (!activeSetData && allowMonthlyFallback) {
        const optOuts = data?.setOptOuts || {}
        const monthlyDoc = setsSnap.docs.find(
          (d) => {
            const dd = d.data()
            return dd.type === 'monthly' && dd.monthKey === monthKey && !optOuts[d.id]
          }
        )
        if (monthlyDoc) {
          const sd = { ...monthlyDoc.data(), id: monthlyDoc.id }
          const n = (sd.questions && sd.questions.length) || 0
          let startForExpiry = getHebrewMonthStartDate(HDate, monthKey)
          if (activeSet?.setId === monthlyDoc.id && activeSet.startedAt) {
            startForExpiry = parseStartDate(activeSet.startedAt) || startForExpiry
          }
          if (!isSetDailyPeriodEnded(startForExpiry, n)) {
            activeSetData = sd
          }
        }
      }

      if (activeSetData) {
        title = `יומנטור – ${activeSetData.title || 'שאלה מחכה לך'}`
        body = 'יש לך שאלה לכתיבה'
        type = 'set_question'
        imageUrl = `${baseUrl}/logo-pisga.png`
        if (activeSetData.coverImageUrl && activeSetData.coverImageUrl.startsWith('http')) {
          imageUrl = activeSetData.coverImageUrl
        }
      }

      const writeUrl = `${baseUrl}/write`
      try {
        await admin.messaging().send({
          notification: { title, body, image: imageUrl },
          data: { type, url: writeUrl },
          webpush: { fcm_options: { link: writeUrl } },
          token,
        })
      } catch (err) {
        console.error(`שגיאה בשליחת התראה ל-${uid}:`, err)
      }
    }
  }
)

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

    const goalsUrl = `${baseUrl}/goals`
    const message = {
      notification: {
        title: 'יומנטור – מטרות חודש חדש',
        body: 'הקדישי רגע לתכנון – מקצועי, אישי ולנפש',
        image: `${baseUrl}/logo-pisga.png`,
      },
      data: { type: 'monthly_goals', url: goalsUrl },
      webpush: { fcm_options: { link: goalsUrl } },
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
  const testUrl = `${baseUrl}/write`
  const message = {
    notification: {
      title: 'יומנטור – התראת בדיקה',
      body: 'ההתראות פועלות!',
      image: `${baseUrl}/logo-pisga.png`,
    },
    data: { type: 'test', url: testUrl },
    webpush: { fcm_options: { link: testUrl } },
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
