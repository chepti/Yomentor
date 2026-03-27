import type { TemplateScheduleNotificationCadence } from '@/types'

/** האם ליום הנוכחי חל לוח זמנים לפי סוג הקצאה */
export function shouldApplyScheduleCadence(
  cadence: TemplateScheduleNotificationCadence | undefined,
  workDays: number[],
  dayOfWeek: number
): boolean {
  const c = cadence || 'every_day'
  if (c === 'every_day') return true
  if (c === 'weekdays_only') return dayOfWeek >= 0 && dayOfWeek <= 4
  if (c === 'work_days') return Array.isArray(workDays) && workDays.includes(dayOfWeek)
  return true
}
