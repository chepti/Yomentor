import type { Set, SetQuestion } from '@/types'

/** מחזיר את השאלה כטקסט (תמיכה בפורמט ישן string[] וחדש SetQuestion[]) */
export function getQuestionText(q: string | SetQuestion): string {
  return typeof q === 'string' ? q : q.text
}

/** מחזיר את תמונת השאלה אם קיימת */
export function getQuestionImage(q: string | SetQuestion): string | undefined {
  return typeof q === 'object' && q?.imageUrl ? q.imageUrl : undefined
}

/** מחזיר את מספר הימים/שאלות בסט */
export function getSetDaysCount(set: Set): number {
  return set.questions?.length ?? 0
}

/** תאריך התחלה מ-activeSet.startedAt (Firestore או Date) */
export function parseActiveSetStartedAt(
  startedAt: unknown
): Date | null {
  if (startedAt == null) return null
  if (typeof (startedAt as { toDate?: () => Date }).toDate === 'function') {
    return (startedAt as { toDate: () => Date }).toDate()
  }
  if (startedAt instanceof Date) return startedAt
  return null
}

/**
 * האם חלון הימים לשאלה יומית נגמר (יום 0 … N-1 מתוך N שאלות).
 * מהיום ה־N ללא קשר אם נענו או לא – הסט נחשב כמסוים לתצוגה והתראות.
 */
export function isSetDailyPeriodEnded(startedAt: unknown, totalQuestions: number): boolean {
  if (totalQuestions <= 0) return true
  const start = parseActiveSetStartedAt(startedAt)
  if (!start) return true
  const startDay = new Date(start)
  startDay.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffMs = today.getTime() - startDay.getTime()
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  return diffDays >= totalQuestions
}
