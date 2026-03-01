/**
 * מסיר תגיות HTML ומחזיר טקסט נקי לתצוגת תקציר
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}
