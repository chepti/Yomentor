import { useCallback, useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

/** שמירת גרסה אישית לתבנית (שלב 2) */
export function usePageTemplatePreferences(uid: string | undefined) {
  const [saving, setSaving] = useState(false)

  const saveCustomBody = useCallback(
    async (templateId: string, customBodyHtml: string) => {
      if (!uid) return
      setSaving(true)
      try {
        await setDoc(
          doc(db, 'users', uid, 'pageTemplatePreferences', templateId),
          {
            templateId,
            customBodyHtml,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      } finally {
        setSaving(false)
      }
    },
    [uid]
  )

  return { saveCustomBody, saving }
}
