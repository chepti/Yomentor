import { useEffect, useRef } from 'react'
import { doc, updateDoc, deleteField } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useActiveSet } from '@/hooks/useActiveSet'
import { useSets } from '@/hooks/useSets'
import { getSetDaysCount, isSetDailyPeriodEnded } from '@/lib/setUtils'

/** מסיר activeSet כשחלון הימים נגמר או כשהסט נמחק מהמערכת */
export function useClearExpiredActiveSet(uid: string | undefined) {
  const activeSet = useActiveSet(uid)
  const sets = useSets()
  const clearingRef = useRef(false)

  useEffect(() => {
    if (!uid || !activeSet?.setId) return
    if (sets.length === 0) return

    const setDoc = sets.find((s) => s.id === activeSet.setId)
    if (!setDoc) {
      if (clearingRef.current) return
      clearingRef.current = true
      updateDoc(doc(db, 'users', uid), { activeSet: deleteField() }).finally(() => {
        clearingRef.current = false
      })
      return
    }

    const n = getSetDaysCount(setDoc)
    if (!isSetDailyPeriodEnded(activeSet.startedAt, n)) return

    if (clearingRef.current) return
    clearingRef.current = true

    updateDoc(doc(db, 'users', uid), { activeSet: deleteField() }).finally(() => {
      clearingRef.current = false
    })
  }, [uid, activeSet, sets])
}
