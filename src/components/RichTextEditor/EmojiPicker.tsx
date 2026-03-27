import { useState } from 'react'
import { Smile, ChevronDown, ChevronUp } from 'lucide-react'

// פסים מהירים – גם חיובי וגם פחות חיובי
const COMPACT_EMOJIS = [
  '😊', '😢', '😤', '🥺', '❤️', '🙏', '✨', '💪', '🌸',
  '😌', '😰', '🙄', '😔', '🌟', '💜', '🎉', '😍', '🔥',
]

const EXPANDED_EMOJIS: Record<string, string[]> = {
  'שמחה וחום': ['😊', '🥰', '😍', '🤗', '😇', '🙂', '😎', '🥳', '😋', '🤩', '💕', '💖'],
  'עצוב וקשה': ['😢', '😭', '😔', '😞', '😟', '🥺', '😰', '😨', '😣', '😖', '😫', '😩'],
  'מתוח וכועס': ['😤', '😠', '😡', '🙄', '😒', '🤬', '💢', '😑', '😐', '😶', '😬', '🤨'],
  'רגשות': ['🤔', '😴', '🤯', '😵', '🫠', '🥱', '😪', '🤐', '🫡', '🤫', '😶‍🌫️', '🫥'],
  'לבבות': ['❤️', '💜', '💖', '💙', '💚', '💛', '🧡', '🩷', '💔', '💗', '💓', '💞'],
  'סמלים': ['✨', '🌟', '💫', '🔥', '💪', '🙏', '🌈', '☀️', '🌙', '⭐', '💯', '👍'],
  'טבע': ['🌸', '🌺', '🌻', '🌷', '🍀', '🌿', '🍃', '🌊', '🏔️', '🌅', '🌄', '🌤️'],
  'חגיגות': ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🎯', '✅', '✔️', '💝', '🎀', '🦋'],
}

function stopMouseDownLosingCaret(e: React.MouseEvent) {
  e.preventDefault()
}

export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const close = () => {
    setIsOpen(false)
    setIsExpanded(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onMouseDown={stopMouseDownLosingCaret}
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-card shadow-soft flex items-center justify-center"
        aria-label="הוספת אימוג'י"
      >
        <Smile size={20} strokeWidth={1.5} className="text-icon-highlight" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} aria-hidden />
          <div className="absolute bottom-full left-0 mb-2 z-50 bg-card rounded-2xl shadow-lg p-3 w-[min(100vw-2rem,280px)] max-h-[min(70vh,360px)] overflow-y-auto border border-muted/20">
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {COMPACT_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onMouseDown={stopMouseDownLosingCaret}
                  onClick={() => {
                    onSelect(e)
                    close()
                  }}
                  className="text-2xl aspect-square flex items-center justify-center p-1 hover:bg-muted/30 rounded-xl transition-colors"
                >
                  {e}
                </button>
              ))}
            </div>
            <button
              type="button"
              onMouseDown={stopMouseDownLosingCaret}
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-center gap-1 w-full py-1.5 text-sm text-muted hover:text-text"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {isExpanded ? 'סגור' : 'הרחבה'}
            </button>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-muted/20 space-y-3">
                {Object.entries(EXPANDED_EMOJIS).map(([cat, emojis]) => (
                  <div key={cat}>
                    <p className="text-xs text-muted mb-1.5">{cat}</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {emojis.map((e) => (
                        <button
                          key={`${cat}-${e}`}
                          type="button"
                          onMouseDown={stopMouseDownLosingCaret}
                          onClick={() => {
                            onSelect(e)
                            close()
                          }}
                          className="text-2xl aspect-square flex items-center justify-center p-1 hover:bg-muted/30 rounded-xl transition-colors"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
