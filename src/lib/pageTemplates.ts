/** תבניות לבניית הרגלים — HTML לעורך עשיר או מבנה צ׳קליסט */

export type PageTemplateKind = 'richtext' | 'checklist'

export interface PageTemplateDef {
  id: string
  title: string
  emoji: string
  description: string
  kind?: PageTemplateKind
  /** תוכן HTML ראשוני (לתבניות richtext) */
  bodyHtml: string
  /** לתבניות checklist */
  checklistTitle?: string
  checklistItems?: string[]
  /** הערות ברירת מחדל (HTML) */
  defaultNotesHtml?: string
}

const tableStyle =
  'border-collapse:collapse;width:100%;max-width:100%;direction:rtl;margin:0.75em 0;'
const cellStyle =
  'border:1px solid #c8d4e6;vertical-align:top;padding:10px;min-height:72px;background:#fafbff;'

/** שורת הזמנה לרשימה — נקודת bullet לכתיבה */
const bulletInvite = '<p dir="rtl" style="margin:0.25em 0;padding-right:0.25em;">• </p>'

export const PAGE_TEMPLATES: PageTemplateDef[] = [
  {
    id: 'gratitude-daily',
    title: 'פתק הודיה יומי',
    emoji: '🙏',
    description: 'כותרות מובנות להודיה — מלאי לפי היום.',
    bodyHtml: `<p dir="rtl"><strong>הודיה יומית</strong></p>
<p dir="rtl" style="font-size:0.9em;color:#5c6b8a;margin:0.4em 0;">הוסיפי נקודות תחת כל כותרת — רשימה קצרה של דברים.</p>
<p dir="rtl"><strong>משהו קטן ששימח אותי היום</strong></p>
${bulletInvite}${bulletInvite}
<p dir="rtl"><strong>על מה אני מודה כרגע</strong></p>
${bulletInvite}${bulletInvite}
<p dir="rtl"><strong>מישהו או משהו שאני מעריכה</strong></p>
${bulletInvite}${bulletInvite}
<p dir="rtl"><strong>רגע שאני רוצה לזכור מהיום</strong></p>
${bulletInvite}${bulletInvite}`,
  },
  {
    id: 'checklist-health',
    title: 'צ׳קליסט יומי — בריאות',
    emoji: '🥗',
    description: 'משימות יומיות עם מיקוד בריאות ואנרגיה.',
    kind: 'checklist',
    checklistTitle: 'היום — בריאות',
    checklistItems: [
      'מים / הידרציה',
      'תנועה קצרה (הליכה, מתיחות)',
      'ארוחה מאוזנת',
      'שינה / מנוחה',
      'משהו שממלא לי את הלב',
    ],
    defaultNotesHtml: `<p dir="rtl"><strong>הערות</strong></p>
${bulletInvite}${bulletInvite}`,
    bodyHtml: '',
  },
  {
    id: 'checklist-teaching',
    title: 'צ׳קליסט יומי — הוראה',
    emoji: '📚',
    description: 'יום בכיתה — מה לעקוב אחריו.',
    kind: 'checklist',
    checklistTitle: 'היום — הוראה',
    checklistItems: [
      'הכנה לשיעור הבא',
      'מעקב אחרי תלמידים שצריכים תשומת לב',
      'חומרים / ציוד',
      'רגע חיובי מהשיעור',
      'משהו לשפר למחר',
    ],
    defaultNotesHtml: `<p dir="rtl"><strong>הערות</strong></p>
${bulletInvite}${bulletInvite}`,
    bodyHtml: '',
  },
  {
    id: 'decision-note',
    title: 'פתק קבלת החלטות',
    emoji: '⚖️',
    description: 'מבנה לפני החלטה — אפשרויות ושיקולים.',
    bodyHtml: `<p dir="rtl"><strong>ההחלטה</strong></p>
${bulletInvite}
<p dir="rtl"><strong>מה הבעיה / השאלה</strong></p>
${bulletInvite}${bulletInvite}
<p dir="rtl"><strong>אפשרות א׳ — יתרונות</strong></p>
${bulletInvite}${bulletInvite}
<p dir="rtl"><strong>אפשרות א׳ — חסרונות</strong></p>
${bulletInvite}${bulletInvite}
<p dir="rtl"><strong>אפשרות ב׳ — יתרונות</strong></p>
${bulletInvite}${bulletInvite}
<p dir="rtl"><strong>אפשרות ב׳ — חסרונות</strong></p>
${bulletInvite}${bulletInvite}
<p dir="rtl"><strong>מה חשוב לי הכי הרבה כאן</strong></p>
${bulletInvite}${bulletInvite}
<p dir="rtl"><strong>צעד קטן הבא (ניסוי)</strong></p>
${bulletInvite}`,
  },
  {
    id: 'eisenhower-matrix',
    title: 'חשוב ודחוף — ארבעה רבעים',
    emoji: '◻️',
    description: 'מטריצת אייזנהאואר — ארבעה רבעים בטבלה.',
    bodyHtml: `<p dir="rtl"><strong>סדר עדיפויות (חשוב / דחוף)</strong></p>
<p dir="rtl" style="font-size:0.9em;color:#5c6b8a;margin:0.4em 0;">בכל רבע: נקודות עם • לפי הצורך.</p>
<table style="${tableStyle}" dir="rtl"><tbody>
<tr>
<td style="${cellStyle}"><strong>דחוף וחשוב</strong><br/>${bulletInvite}${bulletInvite}</td>
<td style="${cellStyle}"><strong>לא דחוף וחשוב</strong><br/>${bulletInvite}${bulletInvite}</td>
</tr>
<tr>
<td style="${cellStyle}"><strong>דחוף ולא חשוב</strong><br/>${bulletInvite}${bulletInvite}</td>
<td style="${cellStyle}"><strong>לא דחוף ולא חשוב</strong><br/>${bulletInvite}${bulletInvite}</td>
</tr>
</tbody></table>
<p dir="rtl"><strong>הערה למחר</strong></p>
${bulletInvite}${bulletInvite}`,
  },
]

export function getPageTemplateById(id: string): PageTemplateDef | undefined {
  return PAGE_TEMPLATES.find((t) => t.id === id)
}

export function isChecklistTemplateId(id: string | null | undefined): boolean {
  if (!id) return false
  return getPageTemplateById(id)?.kind === 'checklist'
}

export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
