import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { PageDraft } from '@/types'

export function useDrafts(uid: string | undefined) {
  const [drafts, setDrafts] = useState<(PageDraft & { id: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setDrafts([])
      setLoading(false)
      return
    }
    const q = query(collection(db, 'users', uid, 'drafts'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setDrafts(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as (PageDraft & { id: string })[]
        )
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [uid])

  return { drafts, loading }
}
