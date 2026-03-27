import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getPageTemplateById } from '@/lib/pageTemplates'
import { serializeChecklistDocument } from '@/lib/checklistTemplateHtml'
import type { PageTemplatePreference } from '@/types'

/** מיזוג תבנית ברירת מחדל עם העדפת משתמש מ-Firestore */
export async function getMergedTemplateBody(
  uid: string | undefined,
  templateId: string
): Promise<string> {
  const def = getPageTemplateById(templateId)
  if (def?.kind === 'checklist') {
    return ''
  }
  const base = def?.bodyHtml ?? ''
  if (!uid) return base
  const snap = await getDoc(doc(db, 'users', uid, 'pageTemplatePreferences', templateId))
  if (!snap.exists()) return base
  const pref = snap.data() as PageTemplatePreference
  const custom = pref.customBodyHtml?.trim()
  return custom || base
}

/** הערות בלבד לתבנית צ׳קליסט (מוזג עם העדפה) */
export async function getMergedNotesForChecklist(
  uid: string | undefined,
  templateId: string
): Promise<string> {
  const def = getPageTemplateById(templateId)
  const base = def?.defaultNotesHtml ?? '<p><br></p>'
  if (!uid) return base
  const snap = await getDoc(doc(db, 'users', uid, 'pageTemplatePreferences', templateId))
  if (!snap.exists()) return base
  const pref = snap.data() as PageTemplatePreference
  const custom = pref.customBodyHtml?.trim()
  return custom || base
}

/** גוף טיוטה ראשוני לתבנית (כולל סריאליזציה לצ׳קליסט) */
export async function getTemplateInitialDraftBody(
  uid: string | undefined,
  templateId: string
): Promise<string> {
  const def = getPageTemplateById(templateId)
  if (
    def?.kind === 'checklist' &&
    def.checklistItems?.length &&
    def.checklistTitle
  ) {
    const notes = await getMergedNotesForChecklist(uid, templateId)
    return serializeChecklistDocument(
      def.checklistTitle,
      def.checklistItems,
      def.checklistItems.map(() => false),
      notes
    )
  }
  return getMergedTemplateBody(uid, templateId)
}
