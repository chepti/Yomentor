import { HDate } from '@hebcal/core'

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

export function toHebrewDate(date: Date): string {
  const hDate = new HDate(date)
  const dayName = DAY_NAMES[date.getDay()]
  const formatted = hDate.render('he')
  return `יום ${dayName}, ${formatted}`
}

export function toHebrewDateShort(date: Date): string {
  const hDate = new HDate(date)
  return hDate.render('he')
}
