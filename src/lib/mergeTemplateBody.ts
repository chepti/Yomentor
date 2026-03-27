import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getPageTemplateById } from '@/lib/pageTemplates'
import type { PageTemplatePreference } from '@/types'

/** מיזוג תבנית ברירת מחדל עם העדפת משתמש מ-Firestore */
export async function getMergedTemplateBody(
  uid: string | undefined,
  templateId: string
): Promise<string> {
  const def = getPageTemplateById(templateId)
  const base = def?.bodyHtml ?? ''
  if (!uid) return base
  const snap = await getDoc(doc(db, 'users', uid, 'pageTemplatePreferences', templateId))
  if (!snap.exists()) return base
  const pref = snap.data() as PageTemplatePreference
  const custom = pref.customBodyHtml?.trim()
  return custom || base
}
