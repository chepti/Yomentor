import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Set } from '@/types'

export function useSets() {
  const [sets, setSets] = useState<(Set & { id: string })[]>([])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'sets'), (snap) => {
      setSets(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as (Set & { id: string })[]
      )
    })
    return unsub
  }, [])

  return sets
}
