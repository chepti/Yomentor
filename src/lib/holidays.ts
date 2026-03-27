import { HebrewCalendar, HDate } from '@hebcal/core'

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
  // כט לחודש אינו יום חג כשהחודש עם 30 ימים (יש ל')
  const hDate = new HDate(d)
  const hebrewDay = hDate.getDate()
  const daysInMonth = new HDate(1, hDate.getMonth(), hDate.getFullYear()).daysInMonth()
  const is29thIn30DayMonth = hebrewDay === 29 && daysInMonth === 30

  const events = HebrewCalendar.getHolidaysOnDate(d, true)
  if (events && events.length > 0 && !is29thIn30DayMonth) {
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
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
  const hDate = new HDate(d)
  const hebrewDay = hDate.getDate()
  const daysInMonth = new HDate(1, hDate.getMonth(), hDate.getFullYear()).daysInMonth()
  const is29thIn30DayMonth = hebrewDay === 29 && daysInMonth === 30

  if (is29thIn30DayMonth) {
    const dateKey = toDateKey(d)
    if (SUMMER_VACATION_RANGES.some((r) => isInRange(dateKey, r))) {
      return ['חופש גדול']
    }
    return []
  }

  const events = HebrewCalendar.getHolidaysOnDate(d, true)
  if (!events || events.length === 0) {
    const dateKey = toDateKey(d)
    if (SUMMER_VACATION_RANGES.some((r) => isInRange(dateKey, r))) {
      return ['חופש גדול']
    }
    return []
  }
  return events
    .filter((e) => ((e as { desc?: string }).desc ?? '').toLowerCase() !== 'shabbat')
    .map((e) =>
      typeof e.render === 'function'
        ? typeof e.renderBrief === 'function'
          ? e.renderBrief('he-x-NoNikud')
          : e.render('he-x-NoNikud')
        : e.desc ?? '',
    )
    .filter(Boolean)
}

/** טקסט קצר לתא ביומן: עד שני אירועים, בלי ניקוד */
export function getHolidayCalendarCaption(date: Date): string | null {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
  const hDate = new HDate(d)
  const hebrewDay = hDate.getDate()
  const daysInMonth = new HDate(1, hDate.getMonth(), hDate.getFullYear()).daysInMonth()
  const is29thIn30DayMonth = hebrewDay === 29 && daysInMonth === 30

  if (is29thIn30DayMonth) {
    const dateKey = toDateKey(d)
    if (SUMMER_VACATION_RANGES.some((r) => isInRange(dateKey, r))) {
      return 'חופש גדול'
    }
    return null
  }

  const events = HebrewCalendar.getHolidaysOnDate(d, true)
  if (!events || events.length === 0) {
    const dateKey = toDateKey(d)
    if (SUMMER_VACATION_RANGES.some((r) => isInRange(dateKey, r))) {
      return 'חופש גדול'
    }
    return null
  }

  const parts: string[] = []
  for (const e of events) {
    const desc = ((e as { desc?: string }).desc ?? '').toLowerCase()
    if (desc === 'shabbat') continue
    const text =
      typeof e.render === 'function'
        ? typeof e.renderBrief === 'function'
          ? e.renderBrief('he-x-NoNikud')
          : e.render('he-x-NoNikud')
        : (e as { desc?: string }).desc ?? ''
    if (text && !parts.includes(text)) parts.push(text)
    if (parts.length >= 2) break
  }

  if (parts.length === 0) {
    const dateKey = toDateKey(d)
    if (SUMMER_VACATION_RANGES.some((r) => isInRange(dateKey, r))) {
      return 'חופש גדול'
    }
    return null
  }
  return parts.join(' · ')
}
