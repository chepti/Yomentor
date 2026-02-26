import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ActiveSet } from '@/types'

export function useActiveSet(uid: string | undefined) {
  const [activeSet, setActiveSet] = useState<ActiveSet | null>(null)

  useEffect(() => {
    if (!uid) {
      setActiveSet(null)
      return
    }
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      setActiveSet((snap.data()?.activeSet as ActiveSet) || null)
    })
    return unsub
  }, [uid])

  return activeSet
}
