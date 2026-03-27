/** תבניות עמוד סטטיות — HTML לעורך עשיר (RTL) */

export interface PageTemplateDef {
  id: string
  title: string
  emoji: string
  description: string
  /** תוכן HTML ראשוני */
  bodyHtml: string
}

const tableStyle =
  'border-collapse:collapse;width:100%;max-width:100%;direction:rtl;margin:0.75em 0;'
const cellStyle =
  'border:1px solid #c8d4e6;vertical-align:top;padding:10px;min-height:72px;background:#fafbff;'

export const PAGE_TEMPLATES: PageTemplateDef[] = [
  {
    id: 'gratitude-daily',
    title: 'פתק הודיה יומי',
    emoji: '🙏',
    description: 'כותרות מובנות להודיה — מלאי לפי היום.',
    bodyHtml: `<p><strong>הודיה יומית</strong></p>
<p><br></p>
<p><strong>משהו קטן ששימח אותי היום</strong></p>
<p><br></p>
<p><strong>על מה אני מודה כרגע</strong></p>
<p><br></p>
<p><strong>מישהו או משהו שאני מעריכה</strong></p>
<p><br></p>
<p><strong>רגע שאני רוצה לזכור מהיום</strong></p>
<p><br></p>`,
  },
  {
    id: 'checklist-health',
    title: 'צ׳קליסט יומי — בריאות',
    emoji: '🥗',
    description: 'משימות יומיות עם מיקוד בריאות ואנרגיה.',
    bodyHtml: `<p><strong>היום — בריאות</strong></p>
<p><br></p>
<p>☐ מים / הידרציה</p>
<p>☐ תנועה קצרה (הליכה, מתיחות)</p>
<p>☐ ארוחה מאוזנת</p>
<p>☐ שינה / מנוחה</p>
<p>☐ משהו שממלא לי את הלב</p>
<p><br></p>
<p><strong>הערות</strong></p>
<p><br></p>`,
  },
  {
    id: 'checklist-teaching',
    title: 'צ׳קליסט יומי — הוראה',
    emoji: '📚',
    description: 'יום בכיתה — מה לעקוב אחריו.',
    bodyHtml: `<p><strong>היום — הוראה</strong></p>
<p><br></p>
<p>☐ הכנה לשיעור הבא</p>
<p>☐ מעקב אחרי תלמידים שצריכים תשומת לב</p>
<p>☐ חומרים / ציוד</p>
<p>☐ רגע חיובי מהשיעור</p>
<p>☐ משהו לשפר למחר</p>
<p><br></p>
<p><strong>הערות</strong></p>
<p><br></p>`,
  },
  {
    id: 'decision-note',
    title: 'פתק קבלת החלטות',
    emoji: '⚖️',
    description: 'מבנה לפני החלטה — אפשרויות ושיקולים.',
    bodyHtml: `<p><strong>ההחלטה</strong></p>
<p><br></p>
<p><strong>מה הבעיה / השאלה</strong></p>
<p><br></p>
<p><strong>אפשרות א׳ — יתרונות</strong></p>
<p><br></p>
<p><strong>אפשרות א׳ — חסרונות</strong></p>
<p><br></p>
<p><strong>אפשרות ב׳ — יתרונות</strong></p>
<p><br></p>
<p><strong>אפשרות ב׳ — חסרונות</strong></p>
<p><br></p>
<p><strong>מה חשוב לי הכי הרבה כאן</strong></p>
<p><br></p>
<p><strong>צעד קטן הבא (ניסוי)</strong></p>
<p><br></p>`,
  },
  {
    id: 'eisenhower-matrix',
    title: 'חשוב ודחוף — ארבעה רבעים',
    emoji: '◻️',
    description: 'מטריצת אייזנהאואר — ארבעה רבעים בטבלה.',
    bodyHtml: `<p><strong>סדר עדיפויות (חשוב / דחוף)</strong></p>
<p><br></p>
<table style="${tableStyle}" dir="rtl"><tbody>
<tr>
<td style="${cellStyle}"><strong>דחוף וחשוב</strong><br><br></td>
<td style="${cellStyle}"><strong>לא דחוף וחשוב</strong><br><br></td>
</tr>
<tr>
<td style="${cellStyle}"><strong>דחוף ולא חשוב</strong><br><br></td>
<td style="${cellStyle}"><strong>לא דחוף ולא חשוב</strong><br><br></td>
</tr>
</tbody></table>
<p><br></p>
<p><strong>הערה למחר</strong></p>
<p><br></p>`,
  },
]

export function getPageTemplateById(id: string): PageTemplateDef | undefined {
  return PAGE_TEMPLATES.find((t) => t.id === id)
}

export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
