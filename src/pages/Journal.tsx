import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { he } from 'date-fns/locale'
import { useAuth } from '@/hooks/useAuth'
import { useEntries } from '@/hooks/useEntries'
import { Card } from '@/components/Card'

const WEEKDAYS = ['ש', 'ו', 'ה', 'ד', 'ג', 'ב', 'א']

export function Journal() {
  const { user } = useAuth()
  const entries = useEntries(user?.uid)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const daysWithEntries = new Set(
    entries
      .map((e) => e.date?.toDate?.()?.toISOString?.().split('T')[0])
      .filter(Boolean)
  )

  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-6">
        <span className="text-xl">🔍</span>
        <h1 className="text-xl font-bold">
          {format(currentMonth, 'MMMM yyyy', { locale: he })}
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          >
            ›
          </button>
        </div>
      </header>

      <div className="bg-card rounded-card shadow-soft p-4 mb-6">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-sm text-muted">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const hasEntry = daysWithEntries.has(day.toISOString().split('T')[0])
            return (
              <Link
                key={day.toISOString()}
                to={`/write?date=${day.toISOString().split('T')[0]}`}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg ${
                  hasEntry ? 'bg-primary/20' : ''
                }`}
              >
                <span>{format(day, 'd')}</span>
                {hasEntry && <span className="w-1 h-1 rounded-full bg-primary" />}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">תמונות מהחודש</h3>
        <button type="button" className="text-primary text-sm">
          הצג הכל
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {entries
          .filter((e) => e.imageUrl)
          .slice(0, 5)
          .map((e) => (
            <img
              key={e.id}
              src={e.imageUrl}
              alt=""
              className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
            />
          ))}
        {entries.filter((e) => e.imageUrl).length === 0 && (
          <p className="text-muted text-sm">אין תמונות החודש</p>
        )}
      </div>

      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-bold">בוקר של השראה</h4>
            <p className="text-sm text-muted">התחלתי את היום עם כתיבה ביומן וקפה...</p>
          </div>
          <span className="text-primary">→</span>
        </div>
      </Card>
    </div>
  )
}
