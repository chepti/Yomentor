import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { he } from 'date-fns/locale'
import { useAuth, ensureProfile } from '@/hooks/useAuth'
import { useEntries } from '@/hooks/useEntries'
import { HDate } from '@hebcal/core'
import { dayToGematriya, getHebrewMonthBlocks } from '@/lib/hebrewDate'
import { getHolidayCalendarCaption, isHoliday } from '@/lib/holidays'
import { extractFirstStickerEmoji } from '@/lib/emojiSticker'

/** ימי השבוע: א=ראשון (ימין), ש=שבת (שמאל) – ב-RTL עמודה 0=ימין */
const WEEKDAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const MONTHS_BEFORE = 6
const MONTHS_AFTER = 6

export function Journal() {
  const { user, profile, profileLoaded } = useAuth()
  const entries = useEntries(user?.uid)
  const [useHebrewDate, setUseHebrewDate] = useState(() => {
    try {
      return localStorage.getItem('journal-hebrew-view') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (!profileLoaded || !user) return
    if (profile?.journalHebrewCalendar === true || profile?.journalHebrewCalendar === false) {
      setUseHebrewDate(profile.journalHebrewCalendar)
      try {
        localStorage.setItem('journal-hebrew-view', String(profile.journalHebrewCalendar))
      } catch {
        /* ignore */
      }
    }
  }, [profileLoaded, user?.uid, profile?.journalHebrewCalendar])

  const toggleHebrewView = () => {
    setUseHebrewDate((v) => {
      const next = !v
      try {
        localStorage.setItem('journal-hebrew-view', String(next))
      } catch {
        /* ignore */
      }
      if (user) {
        void ensureProfile(user.uid, { journalHebrewCalendar: next })
      }
      return next
    })
  }
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const todayMonthBlockRef = useRef<HTMLDivElement>(null)

  const scrollToTodayMonth = () => {
    todayMonthBlockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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

  const holidayCaptionByDateKey = useMemo(() => {
    const map = new Map<string, string>()
    for (const block of monthBlocks) {
      const days = eachDayOfInterval({ start: block.monthStart, end: block.monthEnd })
      for (const day of days) {
        const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
        const cap = getHolidayCalendarCaption(day)
        if (cap) map.set(key, cap)
      }
    }
    return map
  }, [monthBlocks])

  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  useEffect(() => {
    todayMonthBlockRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
  }, [])

  return (
    <div className="p-4">
      <header className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={scrollToTodayMonth}
            className="text-sm px-3 py-1.5 rounded-full border-2 border-[#2E499B] text-[#2E499B] font-medium bg-transparent"
          >
            היום
          </button>
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
        className="journal-calendar-scroll overflow-y-auto pb-4"
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
                ref={isCurrentMonth ? todayMonthBlockRef : null}
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
                    const stickerEmoji =
                      !entryWithImage && dayEntries.length > 0
                        ? dayEntries
                            .map((e) => extractFirstStickerEmoji(e.text))
                            .find((s): s is string => Boolean(s))
                        : null
                    const isHolidayDay = isHoliday(day)
                    const isToday = dateKey === todayKey
                    const holidayCaption = !entryWithImage ? holidayCaptionByDateKey.get(dateKey) : null

                    return (
                      <Link
                        key={dateKey}
                        to={`/journal/day/${dateKey}`}
                        className={`flex flex-col items-center justify-center rounded-xl overflow-hidden min-h-[44px] aspect-square gap-0.5 p-0.5 ${
                          hasEntry && !entryWithImage ? 'bg-[#6896F0]/20' : ''
                        } ${isHolidayDay ? 'bg-[#FFD699]/70' : ''} ${
                          isToday ? 'border-2 border-[#2E499B] box-border' : ''
                        }`}
                      >
                        {entryWithImage ? (
                          <img
                            src={entryWithImage.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : stickerEmoji ? (
                          <div className="flex flex-col items-center justify-center gap-0.5 w-full min-h-0 py-0.5">
                            <span className="text-[clamp(1.15rem,4.2vw,1.55rem)] leading-none select-none">
                              {stickerEmoji}
                            </span>
                            <span className="text-[10px] leading-none text-muted font-medium">
                              {useHebrewDate
                                ? dayToGematriya(new HDate(day).getDate())
                                : format(day, 'd')}
                            </span>
                            {holidayCaption && (
                              <span className="text-[8px] leading-tight text-center text-[#2E499B]/85 line-clamp-2 px-0.5 w-full font-medium">
                                {holidayCaption}
                              </span>
                            )}
                          </div>
                        ) : (
                          <>
                            <span className="text-sm leading-none shrink-0">
                              {useHebrewDate
                                ? dayToGematriya(new HDate(day).getDate())
                                : format(day, 'd')}
                            </span>
                            {holidayCaption && (
                              <span className="text-[9px] leading-tight text-center text-[#2E499B]/90 line-clamp-2 px-0.5 w-full font-medium">
                                {holidayCaption}
                              </span>
                            )}
                          </>
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
