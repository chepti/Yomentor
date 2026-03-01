import { HDate } from '@hebcal/core'

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

/** מפתח חודש עברי: שנה-חודש (למשל 5786-02 לאדר) */
export function getHebrewMonthKey(date: Date): string {
  const h = new HDate(date)
  const year = h.getFullYear()
  const month = h.getMonth()
  return `${year}-${String(month).padStart(2, '0')}`
}

/** האם היום ראש חודש עברי – יום 1 (להתראות) */
export function isRoshChodesh(date: Date): boolean {
  const h = new HDate(date)
  return h.getDate() === 1
}

export function toHebrewDate(date: Date): string {
  const hDate = new HDate(date)
  const dayName = DAY_NAMES[date.getDay()]
  // גימטריה: יום באותיות עבריות (י במקום 10, תשפ״ו במקום 5786)
  const formatted = hDate.renderGematriya(true, false)
  return `יום ${dayName}, ${formatted}`
}

export function toHebrewDateShort(date: Date): string {
  const hDate = new HDate(date)
  return hDate.renderGematriya(true, false)
}

/** שם חודש עברי + שנה (למשל: אדר תשפ״ו) */
export function toHebrewMonthYear(date: Date): string {
  const hDate = new HDate(date)
  const full = hDate.renderGematriya(true, false)
  const parts = full.split(' ')
  return parts.length >= 3 ? `${parts[1]} ${parts[2]}` : full
}

/** יום בגימטריה (י, ט״ו וכו') */
export function dayToGematriya(day: number): string {
  if (day < 1 || day > 30) return String(day)
  const hDate = new HDate(day, 1, 5786) // ניסן - חודש עם 30 ימים
  const str = hDate.renderGematriya(true, true)
  const dayPart = str.split(' ')[0]
  return dayPart || String(day)
}

/** שם חודש עברי בלבד (למשל: אדר) */
export function toHebrewMonthName(date: Date): string {
  const hDate = new HDate(date)
  const full = hDate.renderGematriya(true, false)
  const parts = full.split(' ')
  return parts.length >= 2 ? parts[1] : full
}

export interface HebrewMonthBlock {
  monthStart: Date
  monthEnd: Date
  label: string
}

/** רשימת בלוקי חודשים עבריים לתצוגה (תשרי תחילה) */
export function getHebrewMonthBlocks(before = 6, after = 6): HebrewMonthBlock[] {
  const hNow = new HDate(new Date())
  let h = hNow
  for (let i = 0; i < before; i++) {
    h = h.subtract(1, 'M')
  }
  const blocks: HebrewMonthBlock[] = []
  for (let i = 0; i < before + after + 1; i++) {
    const hFirst = new HDate(1, h.getMonth(), h.getFullYear())
    const daysInMonth = hFirst.daysInMonth()
    const hLast = new HDate(daysInMonth, h.getMonth(), h.getFullYear())
    const full = hFirst.renderGematriya(true, false)
    const parts = full.split(' ')
    const label = parts.length >= 3 ? `${parts[1]} ${parts[2]}` : full
    blocks.push({
      monthStart: hFirst.greg(),
      monthEnd: hLast.greg(),
      label,
    })
    h = h.add(1, 'M')
  }
  return blocks
}
