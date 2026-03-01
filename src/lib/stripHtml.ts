/**
 * מסיר תגיות HTML ומחזיר טקסט נקי לתצוגת תקציר
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
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
