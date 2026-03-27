import { useSets } from '@/hooks/useSets'
import { useActiveSet } from '@/hooks/useActiveSet'
import { useSetOptOuts } from '@/hooks/useSetOptOuts'
import { getHebrewMonthKey, getHebrewMonthStartDate } from '@/lib/hebrewDate'
import { getSetDaysCount, isSetDailyPeriodEnded } from '@/lib/setUtils'
import type { Set } from '@/types'

/** מחזיר את הסט הפעיל האפקטיבי – מפורש או חודשי (אם לא opted out), בלי סט שחלון הימים שלו נגמר */
export function useResolvedActiveSet(uid: string | undefined): {
  activeSet: { setId: string; currentQuestionIndex: number; startedAt: unknown } | null
  activeSetData: (Set & { id: string }) | null
} {
  const sets = useSets()
  const activeSet = useActiveSet(uid)
  const optOuts = useSetOptOuts(uid)
  const currentMonthKey = getHebrewMonthKey(new Date())

  const explicitSet = activeSet ? sets.find((s) => s.id === activeSet.setId) : null
  if (explicitSet && activeSet) {
    const n = getSetDaysCount(explicitSet)
    if (!isSetDailyPeriodEnded(activeSet.startedAt, n)) {
      return { activeSet, activeSetData: explicitSet }
    }
  }

  const monthlySet = sets.find(
    (s) => s.type === 'monthly' && s.monthKey === currentMonthKey && !optOuts[s.id]
  )
  if (!monthlySet) {
    return { activeSet: null, activeSetData: null }
  }

  if (activeSet && activeSet.setId !== monthlySet.id) {
    const other = sets.find((s) => s.id === activeSet.setId)
    if (!other || isSetDailyPeriodEnded(activeSet.startedAt, getSetDaysCount(other))) {
      return { activeSet: null, activeSetData: null }
    }
  }

  if (activeSet?.setId === monthlySet.id && isSetDailyPeriodEnded(activeSet.startedAt, getSetDaysCount(monthlySet))) {
    return { activeSet: null, activeSetData: null }
  }

  const n = getSetDaysCount(monthlySet)
  const hebrewStart = getHebrewMonthStartDate(monthlySet.monthKey || currentMonthKey)
  if (isSetDailyPeriodEnded(hebrewStart, n)) {
    return { activeSet: null, activeSetData: null }
  }

  const startedAt =
    activeSet?.setId === monthlySet.id && activeSet.startedAt ? activeSet.startedAt : hebrewStart
  const currentQuestionIndex =
    activeSet?.setId === monthlySet.id ? activeSet.currentQuestionIndex : 0

  return {
    activeSet: {
      setId: monthlySet.id,
      currentQuestionIndex,
      startedAt,
    },
    activeSetData: monthlySet,
  }
}
