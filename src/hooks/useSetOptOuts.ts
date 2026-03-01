import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useSetOptOuts(uid: string | undefined): Record<string, boolean> {
  const [optOuts, setOptOuts] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!uid) {
      setOptOuts({})
      return
    }
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      setOptOuts((snap.data()?.setOptOuts as Record<string, boolean>) || {})
    })
    return unsub
  }, [uid])

  return optOuts
}
