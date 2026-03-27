/** סריאליזציה לתבניות צ׳קליסט — נשמר ב־text של טיוטה/פוסט */

const MARKER_RE = /^<!--YOCHK1:([\s\S]*?)-->\s*/

export interface ChecklistParsed {
  completed: boolean[]
  notesHtml: string
}

export function buildVisibleChecklistHtml(
  title: string,
  items: string[],
  completed: boolean[],
  notesHtml: string
): string {
  const lines = items.map((label, i) => {
    const done = !!completed[i]
    return `<p dir="rtl" style="margin:0.35em 0;"><span style="font-weight:600;color:#6896F0;">${done ? '✓' : '○'}</span> <span style="${done ? 'text-decoration:line-through;opacity:0.75;' : ''}">${escapeHtml(label)}</span></p>`
  })
  return `<p dir="rtl"><strong>${escapeHtml(title)}</strong></p>${lines.join('')}${notesHtml ? `<div dir="rtl" class="yo-notes">${notesHtml}</div>` : ''}`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function serializeChecklistDocument(
  title: string,
  items: string[],
  completed: boolean[],
  notesHtml: string
): string {
  const payload = JSON.stringify({ c: completed, n: notesHtml, items })
  const b64 = btoa(unescape(encodeURIComponent(payload)))
  const visible = buildVisibleChecklistHtml(title, items, completed, notesHtml)
  return `<!--YOCHK1:${b64}-->\n${visible}`
}

export function parseChecklistDocument(html: string): ChecklistParsed | null {
  const m = html.match(MARKER_RE)
  if (!m) return null
  try {
    const json = decodeURIComponent(escape(atob(m[1])))
    const o = JSON.parse(json) as { c: boolean[]; n: string; items?: string[] }
    return {
      completed: Array.isArray(o.c) ? o.c : [],
      notesHtml: typeof o.n === 'string' ? o.n : '',
    }
  } catch {
    return null
  }
}

export function stripChecklistMarkerForEditor(html: string): string {
  return html.replace(MARKER_RE, '').trim()
}
