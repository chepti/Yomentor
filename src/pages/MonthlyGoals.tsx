import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { addMonths, subMonths } from 'date-fns'
import { ArrowLeft, Plus, Check, ChevronRight, ChevronLeft } from 'lucide-react'
import { HDate } from '@hebcal/core'
import { useAuth } from '@/hooks/useAuth'
import { useMonthlyGoals } from '@/hooks/useMonthlyGoals'
import { toHebrewMonthYear, getHebrewMonthKey } from '@/lib/hebrewDate'
import { Card } from '@/components/Card'
import type { MonthlyGoals } from '@/types'

const SECTIONS = [
  { key: 'professional' as const, label: 'מקצועי', color: '#6896F0' },
  { key: 'personal' as const, label: 'אישי / משפחתי', color: '#FF8000' },
  { key: 'spiritual' as const, label: 'לנפש', color: '#2E499B' },
] as const

function getMonthDateFromKey(monthKey: string): Date {
  const [y, m] = monthKey.split('-').map(Number)
  const h = new HDate(1, m, y)
  return h.greg()
}

function getPrevNextMonthKeys(monthKey: string): { prev: string; next: string } {
  const d = getMonthDateFromKey(monthKey)
  const prevD = subMonths(d, 1)
  const nextD = addMonths(d, 1)
  return { prev: getHebrewMonthKey(prevD), next: getHebrewMonthKey(nextD) }
}

export function MonthlyGoals() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const monthParam = searchParams.get('month')
  const { user } = useAuth()
  const { goals, loading, save } = useMonthlyGoals(user?.uid, monthParam ?? undefined)
  const [newItem, setNewItem] = useState<Record<string, string>>({})

  const addItem = useCallback(
    (section: keyof Pick<MonthlyGoals, 'professional' | 'personal' | 'spiritual'>) => {
      if (!goals) return
      const text = newItem[section]?.trim()
      if (!text) return
      const list = [...goals[section], text]
      const completed = [...goals.completed[section], false]
      save({
        [section]: list,
        completed: { ...goals.completed, [section]: completed },
      })
      setNewItem((prev) => ({ ...prev, [section]: '' }))
    },
    [goals, newItem, save]
  )

  const toggleItem = useCallback(
    (section: keyof Pick<MonthlyGoals, 'professional' | 'personal' | 'spiritual'>, index: number) => {
      if (!goals) return
      const arr = [...goals.completed[section]]
      arr[index] = !arr[index]
      save({ completed: { ...goals.completed, [section]: arr } })
    },
    [goals, save]
  )

  const removeItem = useCallback(
    (section: keyof Pick<MonthlyGoals, 'professional' | 'personal' | 'spiritual'>, index: number) => {
      if (!goals) return
      const list = goals[section].filter((_, i) => i !== index)
      const completed = goals.completed[section].filter((_, i) => i !== index)
      save({
        [section]: list,
        completed: { ...goals.completed, [section]: completed },
      })
    },
    [goals, save]
  )

  if (loading || !goals) {
    return (
      <div className="min-h-screen bg-bg p-4 flex items-center justify-center">
        <p className="text-muted">טוען...</p>
      </div>
    )
  }

  const monthDate = goals.monthKey ? getMonthDateFromKey(goals.monthKey) : new Date()
  const monthLabel = toHebrewMonthYear(monthDate)
  const { prev, next } = getPrevNextMonthKeys(goals.monthKey)
  const currentKey = getHebrewMonthKey(new Date())

  const goToMonth = (key: string) => {
    navigate(`/goals?month=${key}`)
  }

  return (
    <div className="min-h-screen bg-bg p-4 pb-8">
      <header className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-primary p-1"
          aria-label="חזרה"
        >
          <ArrowLeft size={24} strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToMonth(prev)}
            className="text-muted p-1"
            aria-label="חודש קודם"
          >
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
          <h1 className="text-lg font-bold text-primary min-w-[120px] text-center">מטרות {monthLabel}</h1>
          <button
            type="button"
            onClick={() => goToMonth(next)}
            className="text-muted p-1"
            aria-label="חודש הבא"
            disabled={next === currentKey}
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
        </div>
        <div className="w-10" />
      </header>

      <p className="text-sm text-muted mb-6 text-center">
        הקדישי זמן לתכנון – מקצועי, אישי ולנפש
      </p>

      <div className="flex flex-col gap-6">
        {SECTIONS.map(({ key, label, color }) => (
          <Card key={key} className="border-r-4" style={{ borderRightColor: color }}>
            <h2 className="font-bold mb-3" style={{ color }}>{label}</h2>
            <ul className="flex flex-col gap-2 mb-3">
              {(goals[key] ?? []).map((text, i) => (
                <li
                  key={`${key}-${i}`}
                  className="flex items-center gap-2 group"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(key, i)}
                    className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
                    style={{
                      borderColor: color,
                      backgroundColor: goals.completed[key][i] ? color : 'transparent',
                    }}
                    aria-label={goals.completed[key][i] ? 'בטל סימון' : 'סמן כהושלם'}
                  >
                    {goals.completed[key][i] && (
                      <Check size={14} strokeWidth={2.5} className="text-white" />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-right ${
                      goals.completed[key][i] ? 'line-through text-muted' : ''
                    }`}
                  >
                    {text}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(key, i)}
                    className="opacity-0 group-hover:opacity-100 text-muted hover:text-[#E22830] text-sm px-1"
                    aria-label="הסר"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                type="text"
                value={newItem[key] ?? ''}
                onChange={(e) => setNewItem((p) => ({ ...p, [key]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && addItem(key)}
                placeholder={`הוספת מטרה ב${label}...`}
                className="flex-1 px-3 py-2 rounded-xl border border-muted/30 bg-card text-sm"
              />
              <button
                type="button"
                onClick={() => addItem(key)}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${color}20`, color }}
                aria-label="הוסף"
              >
                <Plus size={20} strokeWidth={2} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
