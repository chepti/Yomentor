/**
 * מסיר תגיות HTML ומחזיר טקסט נקי לתצוגת תקציר
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

/** מקודד HTML לצורך שימוש בטוח בתוכן */
export function escapeHtml(s: string): string {
  if (!s || typeof s !== 'string') return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** מחזיר את התשובה בלבד מתוך טקסט שמתחיל בשאלה מודגשת */
export function extractAnswerFromSetEntry(text: string, questionText: string): string {
  if (!text || !questionText) return text || ''
  const prefix = `<p><strong>${escapeHtml(questionText)}</strong></p>`
  if (text.startsWith(prefix)) return text.slice(prefix.length).trim()
  return text
}

/** מחזיר HTML מלא לתצוגה – שאלה (מודגשת) + תשובה. תומך בפורמט ישן (שאלה נפרדת) וחדש (שאלה בתוך text). */
export function getEntryDisplayHtml(entry: { text?: string; questionText?: string } | null): string {
  if (!entry) return ''
  const text = entry.text || ''
  const q = entry.questionText || ''
  if (q) {
    const prefix = `<p><strong>${escapeHtml(q)}</strong></p>`
    if (!text.startsWith(prefix)) return prefix + text
  }
  return text
}

/**
 * מפענח HTML entities – למקרה שהתוכן נשמר מקודד (למשל &lt; במקום <)
 */
export function decodeHtmlForEditor(html: string): string {
  if (!html || typeof html !== 'string') return ''
  if (typeof document === 'undefined') return html
  if (!html.includes('&lt;') && !html.includes('&gt;') && !html.includes('&amp;')) return html
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || html
}
