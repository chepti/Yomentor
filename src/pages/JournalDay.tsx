import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useEntries } from '@/hooks/useEntries'
import { toHebrewDate, toGregorianDateShort } from '@/lib/hebrewDate'
import { getHolidayNames } from '@/lib/holidays'
import { Card } from '@/components/Card'
import { getEntryDisplayHtml } from '@/lib/stripHtml'
import { extractFirstStickerEmoji } from '@/lib/emojiSticker'

export function JournalDay() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const entries = useEntries(user?.uid)

  const isValidDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date + 'T12:00:00').getTime())

  const dayEntries =
    date && isValidDate
      ? entries.filter((e) => {
          const key = e.date?.toDate?.()?.toISOString?.()?.split('T')[0]
          return key === date
        })
      : []

  const dayDate = isValidDate && date ? new Date(date + 'T12:00:00') : new Date()

  if (!isValidDate) {
    return (
      <div className="min-h-screen bg-bg p-4 flex flex-col items-center justify-center gap-4">
        <p className="text-muted">תאריך לא תקין</p>
        <button
          type="button"
          onClick={() => navigate('/journal')}
          className="text-primary font-bold"
        >
          חזרה ליומן
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg p-4">
      <header className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate('/journal')}
          className="text-primary p-1"
          aria-label="חזרה ליומן"
        >
          <ArrowLeft size={24} strokeWidth={1.5} />
        </button>
        <div>
          <h1 className="text-lg font-bold">
            {toHebrewDate(dayDate)} ({toGregorianDateShort(dayDate)})
          </h1>
          {getHolidayNames(dayDate).length > 0 && (
            <p className="text-sm text-primary font-medium mt-0.5">
              {getHolidayNames(dayDate).join(' · ')}
            </p>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {dayEntries.map((entry) => {
          const sticker =
            !entry.imageUrl && entry.text ? extractFirstStickerEmoji(entry.text) : null
          return (
            <Link
              key={entry.id}
              to={`/write?date=${date}&entryId=${entry.id}`}
            >
              <Card className="border-r-4 border-[#6896F0]/40 hover:border-[#6896F0]/70 transition-colors">
                <div className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted mb-1">
                      {entry.date?.toDate?.()?.toLocaleTimeString('he-IL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <div
                      className="line-clamp-3 [&_strong]:font-bold [&_p]:mb-1 last:[&_p]:mb-0"
                      dangerouslySetInnerHTML={{ __html: getEntryDisplayHtml(entry) }}
                    />
                  </div>
                  {entry.imageUrl ? (
                    <img
                      src={entry.imageUrl}
                      alt=""
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : sticker ? (
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#6896F0]/18 to-[#E8EEF9] shadow-inner border border-[#6896F0]/25 text-[2.75rem] leading-none select-none"
                      aria-hidden
                    >
                      {sticker}
                    </div>
                  ) : null}
                </div>
              </Card>
            </Link>
          )
        })}
        {dayEntries.length === 0 && (
          <Card>
            <p className="text-muted text-center py-4">אין פוסטים ביום זה</p>
          </Card>
        )}
      </div>

      <div className="h-20" />
      {date && (
        <Link
          to={`/write?date=${date}`}
          className="block bg-primary text-white py-3 rounded-[50px] text-center font-bold shadow-lg"
        >
          + הוספת פוסט ליום זה
        </Link>
      )}
    </div>
  )
}
