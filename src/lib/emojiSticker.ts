import { stripHtml } from '@/lib/stripHtml'

/**
 * מחזיר את רצף האימוג'י הראשון בטקסט (אחרי הסרת HTML), לתצוגת "מדבקה" ביומן.
 */
export function extractFirstStickerEmoji(htmlOrText: string | undefined): string | null {
  if (!htmlOrText || typeof htmlOrText !== 'string') return null
  const plain = stripHtml(htmlOrText).trim()
  if (!plain) return null
  try {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    for (const { segment } of segmenter.segment(plain)) {
      if (/\p{Extended_Pictographic}/u.test(segment)) {
        return segment
      }
    }
  } catch {
    const m = plain.match(/\p{Extended_Pictographic}/u)
    return m ? m[0] : null
  }
  return null
}
