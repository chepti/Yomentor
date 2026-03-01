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
