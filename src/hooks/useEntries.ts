import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Entry } from '@/types'

export function useEntries(uid: string | undefined) {
  const [entries, setEntries] = useState<(Entry & { id: string })[]>([])

  useEffect(() => {
    if (!uid) {
      setEntries([])
      return
    }
    const q = query(
      collection(db, 'users', uid, 'entries'),
      orderBy('date', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setEntries(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date,
        })) as (Entry & { id: string })[]
      )
    })
    return unsub
  }, [uid])

  return entries
}
