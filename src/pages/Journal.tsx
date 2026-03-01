import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { he } from 'date-fns/locale'
import { useAuth } from '@/hooks/useAuth'
import { useEntries } from '@/hooks/useEntries'
import { HDate } from '@hebcal/core'
import { dayToGematriya, getHebrewMonthBlocks } from '@/lib/hebrewDate'
import { isHoliday } from '@/lib/holidays'

/** ימי השבוע: א=ראשון (ימין), ש=שבת (שמאל) – ב-RTL עמודה 0=ימין */
const WEEKDAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const MONTHS_BEFORE = 6
const MONTHS_AFTER = 6

export function Journal() {
  const { user } = useAuth()
  const entries = useEntries(user?.uid)
  const [useHebrewDate, setUseHebrewDate] = useState(() => {
    try {
      return localStorage.getItem('journal-hebrew-view') === 'true'
    } catch {
      return false
    }
  })

  const toggleHebrewView = () => {
    setUseHebrewDate((v) => {
      const next = !v
      try {
        localStorage.setItem('journal-hebrew-view', String(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const currentMonthRef = useRef<HTMLDivElement>(null)

  const entriesByDate = useMemo(() => {
    const map = new Map<string, (typeof entries)[0][]>()
    for (const e of entries) {
      const d = e.date?.toDate?.()
      if (d) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const list = map.get(key) ?? []
        list.push(e)
        map.set(key, list)
      }
    }
    return map
  }, [entries])

  const now = new Date()
  const monthBlocks = useMemo(() => {
    if (useHebrewDate) {
      return getHebrewMonthBlocks(MONTHS_BEFORE, MONTHS_AFTER).map((b) => ({
        monthStart: b.monthStart,
        monthEnd: b.monthEnd,
        label: b.label,
      }))
    }
    const start = subMonths(now, MONTHS_BEFORE)
    const total = MONTHS_BEFORE + MONTHS_AFTER + 1
    return Array.from({ length: total }, (_, i) => {
      const d = addMonths(start, i)
      return {
        monthStart: startOfMonth(d),
        monthEnd: endOfMonth(d),
        label: format(d, 'MMMM yyyy', { locale: he }),
      }
    })
  }, [useHebrewDate])

  useEffect(() => {
    currentMonthRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
  }, [])

  return (
    <div className="p-4">
      <header className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              scrollContainerRef.current?.scrollBy({ top: -400, behavior: 'smooth' })
            }}
            className="text-[#2E499B] p-1"
            aria-label="גלילה למעלה"
          >
            <ChevronRight size={24} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => {
              scrollContainerRef.current?.scrollBy({ top: 400, behavior: 'smooth' })
            }}
            className="text-[#2E499B] p-1"
            aria-label="גלילה למטה"
          >
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
        </div>
        <button
          type="button"
          onClick={toggleHebrewView}
          className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
            useHebrewDate ? 'bg-primary text-white' : 'bg-card text-muted'
          }`}
        >
          {useHebrewDate ? 'עברי' : 'לועזי'}
        </button>
      </header>

      <div
        ref={scrollContainerRef}
        className="overflow-y-auto pb-4"
        style={{ maxHeight: 'calc(100vh - 180px)' }}
      >
        <div className="flex flex-col gap-8">
          {monthBlocks.map((block, idx) => {
            const { monthStart, monthEnd, label } = block
            const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
            const isCurrentMonth =
              now >= monthStart && now <= monthEnd

            return (
              <div
                key={`${label}-${idx}`}
                ref={isCurrentMonth ? currentMonthRef : null}
                className="bg-transparent rounded-card p-4"
              >
                <h2 className="text-lg font-bold text-center mb-3">{label}</h2>
                <div className="grid grid-cols-7 gap-2 mb-2" dir="rtl">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className="text-center text-sm text-muted">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2" dir="rtl">
                  {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                    <div key={`pad-${i}`} />
                  ))}
                  {days.map((day) => {
                    const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
                    const dayEntries = entriesByDate.get(dateKey) ?? []
                    const hasEntry = dayEntries.length > 0
                    const entryWithImage = dayEntries.find((e) => e.imageUrl)
                    const isHolidayDay = isHoliday(day)

                    return (
                      <Link
                        key={dateKey}
                        to={`/journal/day/${dateKey}`}
                        className={`aspect-square flex flex-col items-center justify-center rounded-xl overflow-hidden min-h-[44px] ${
                          hasEntry && !entryWithImage ? 'bg-[#6896F0]/20' : ''
                        } ${isHolidayDay ? 'bg-[#FFC07F]/50' : ''}`}
                      >
                        {entryWithImage ? (
                          <img
                            src={entryWithImage.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm">
                            {useHebrewDate
                              ? dayToGematriya(new HDate(day).getDate())
                              : format(day, 'd')}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
