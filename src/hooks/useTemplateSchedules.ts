import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { TemplateSchedule } from '@/types'

export function useTemplateSchedules(uid: string | undefined) {
  const [schedules, setSchedules] = useState<(TemplateSchedule & { id: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setSchedules([])
      setLoading(false)
      return
    }
    const unsub = onSnapshot(
      collection(db, 'users', uid, 'templateSchedules'),
      (snap) => {
        setSchedules(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as (TemplateSchedule & { id: string })[]
        )
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [uid])

  return { schedules, loading }
}
