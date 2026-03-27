import { Check } from 'lucide-react'

const ACCENT = '#6896F0'

interface ChecklistTemplateSectionProps {
  title: string
  items: string[]
  completed: boolean[]
  onToggle: (index: number) => void
}

export function ChecklistTemplateSection({
  title,
  items,
  completed,
  onToggle,
}: ChecklistTemplateSectionProps) {
  return (
    <div className="mb-4" dir="rtl">
      <p className="font-bold text-base mb-3">{title}</p>
      <ul className="flex flex-col gap-2">
        {items.map((label, i) => {
          const done = !!completed[i]
          return (
            <li key={i} className="flex items-start gap-2 group">
              <button
                type="button"
                onClick={() => onToggle(i)}
                className="flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors mt-0.5"
                style={{
                  borderColor: ACCENT,
                  backgroundColor: done ? ACCENT : 'transparent',
                }}
                aria-label={done ? 'בטל סימון' : 'סמן כהושלם'}
              >
                {done && <Check size={15} strokeWidth={2.5} className="text-white" />}
              </button>
              <span
                className={`flex-1 text-right leading-relaxed ${
                  done ? 'line-through text-muted' : ''
                }`}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
