import { useSets } from '@/hooks/useSets'
import { useActiveSet } from '@/hooks/useActiveSet'
import { useSetOptOuts } from '@/hooks/useSetOptOuts'
import { getHebrewMonthKey } from '@/lib/hebrewDate'
import type { Set } from '@/types'

/** מחזיר את הסט הפעיל האפקטיבי – מפורש או חודשי (אם לא opted out) */
export function useResolvedActiveSet(uid: string | undefined): {
  activeSet: { setId: string; currentQuestionIndex: number; startedAt: unknown } | null
  activeSetData: (Set & { id: string }) | null
} {
  const sets = useSets()
  const activeSet = useActiveSet(uid)
  const optOuts = useSetOptOuts(uid)
  const currentMonthKey = getHebrewMonthKey(new Date())

  const explicitSet = activeSet ? sets.find((s) => s.id === activeSet.setId) : null
  if (explicitSet) {
    return { activeSet, activeSetData: explicitSet }
  }

  const monthlySet = sets.find(
    (s) => s.type === 'monthly' && s.monthKey === currentMonthKey && !optOuts[s.id]
  )
  if (monthlySet) {
    return {
      activeSet: {
        setId: monthlySet.id,
        currentQuestionIndex: 0,
        startedAt: new Date(),
      },
      activeSetData: monthlySet,
    }
  }

  return { activeSet: null, activeSetData: null }
}
