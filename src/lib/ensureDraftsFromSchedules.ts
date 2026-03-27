import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  Timestamp,
  doc,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toLocalDateKey } from '@/lib/pageTemplates'
import { getTemplateInitialDraftBody } from '@/lib/mergeTemplateBody'
import { shouldApplyScheduleCadence } from '@/lib/scheduleCadence'
import type { TemplateSchedule } from '@/types'

function dayStart(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function dayEnd(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

/**
 * לכל לוח זמנים פעיל — אם אין טיוטה ליום הנוכחי, יוצר טיוטה מהתבנית (המוזגת).
 */
export async function ensureDraftsFromSchedules(uid: string | undefined): Promise<void> {
  if (!uid) return
  const now = new Date()
  const todayKey = toLocalDateKey(now)
  const dayOfWeek = now.getDay()

  const userSnap = await getDoc(doc(db, 'users', uid))
  const workDays = (userSnap.data()?.profile?.workDays as number[] | undefined) ?? [
    0, 1, 2, 3, 4,
  ]

  const schedSnap = await getDocs(collection(db, 'users', uid, 'templateSchedules'))
  for (const docSnap of schedSnap.docs) {
    const s = docSnap.data() as TemplateSchedule
    const start = (s.startDate as Timestamp).toDate()
    const end = (s.endDate as Timestamp).toDate()
    if (now < dayStart(start) || now > dayEnd(end)) continue

    if (!shouldApplyScheduleCadence(s.notificationCadence, workDays, dayOfWeek)) continue

    const scheduleId = docSnap.id
    const draftsQ = query(collection(db, 'users', uid, 'drafts'), where('scheduleId', '==', scheduleId))
    const existing = await getDocs(draftsQ)
    const hasToday = existing.docs.some((d) => d.data().dayKey === todayKey)
    if (hasToday) continue

    const body = await getTemplateInitialDraftBody(uid, s.templateId)
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    await addDoc(collection(db, 'users', uid, 'drafts'), {
      text: body,
      dayKey: todayKey,
      templateId: s.templateId,
      scheduleId,
      status: 'draft',
      date: d,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
}
