import { HebrewCalendar } from '@hebcal/core'

/** טווחי חופש גדול לפי משרד החינוך (תאריכי סיום לימודים - תחילת ספטמבר) */
const SUMMER_VACATION_RANGES: { start: string; end: string }[] = [
  { start: '2024-06-21', end: '2024-08-31' },
  { start: '2025-06-20', end: '2025-08-31' },
  { start: '2026-06-19', end: '2026-08-31' },
  { start: '2027-06-18', end: '2027-08-31' },
  { start: '2028-06-20', end: '2028-08-31' },
]

/** מפתח תאריך YYYY-MM-DD לפי שעון מקומי (לא UTC) */
function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isInRange(dateKey: string, range: { start: string; end: string }): boolean {
  return dateKey >= range.start && dateKey <= range.end
}

/**
 * בודק אם תאריך הוא יום חג/חופשה
 * כולל: חגים עבריים (hebcal) + חופש גדול של משרד החינוך
 */
export function isHoliday(date: Date): boolean {
  // שימוש בצהריים כדי למנוע בעיות timezone בחצות
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
  const dateKey = toDateKey(d)

  // חגים עבריים (לוח ישראל) – לא כולל שבת רגילה
  const events = HebrewCalendar.getHolidaysOnDate(d, true)
  if (events && events.length > 0) {
    const hasHoliday = events.some((e) => {
      const desc = ((e as { desc?: string }).desc ?? '').toLowerCase()
      return desc !== 'shabbat'
    })
    if (hasHoliday) return true
  }

  // חופש גדול - משרד החינוך
  if (SUMMER_VACATION_RANGES.some((r) => isInRange(dateKey, r))) return true

  return false
}

/**
 * מחזיר את שמות החגים/אירועים ביום נתון בעברית (לצורך תצוגה)
 */
export function getHolidayNames(date: Date): string[] {
  const events = HebrewCalendar.getHolidaysOnDate(date, true)
  if (!events || events.length === 0) {
    const dateKey = toDateKey(date)
    if (SUMMER_VACATION_RANGES.some((r) => isInRange(dateKey, r))) {
      return ['חופש גדול']
    }
    return []
  }
  return events.map((e) => (typeof e.render === 'function' ? e.render('he') : e.desc ?? '')).filter(Boolean)
}
