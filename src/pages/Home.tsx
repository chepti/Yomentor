import { Link } from 'react-router-dom'
import { Bell, ClipboardList, Calendar, Check, PenLine, Plus, Target, ChevronLeft } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Avatar } from '@/components/Avatar'
import { Card } from '@/components/Card'
import { useAuth } from '@/hooks/useAuth'
import { useEntries } from '@/hooks/useEntries'
import { useMonthlyGoals } from '@/hooks/useMonthlyGoals'
import { useResolvedActiveSet } from '@/hooks/useResolvedActiveSet'
import { getHebrewMonthKey } from '@/lib/hebrewDate'
import { getQuestionText } from '@/lib/setUtils'
import { stripHtml } from '@/lib/stripHtml'

function getQuestionIndexForToday(
  startedAt: { toDate?: () => Date } | Date | undefined,
  totalQuestions: number
): number {
  if (!startedAt || totalQuestions === 0) return 0
  const start = startedAt && typeof (startedAt as { toDate?: () => Date }).toDate === 'function'
    ? (startedAt as { toDate: () => Date }).toDate()
    : startedAt instanceof Date ? startedAt : new Date()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDay = new Date(start)
  startDay.setHours(0, 0, 0, 0)
  const diffMs = today.getTime() - startDay.getTime()
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  return Math.min(Math.max(0, diffDays), totalQuestions - 1)
}

export function Home() {
  const { user } = useAuth()
  const entries = useEntries(user?.uid)
  const currentMonthKey = getHebrewMonthKey(new Date())
  const { goals } = useMonthlyGoals(user?.uid, currentMonthKey)
  const { activeSet, activeSetData } = useResolvedActiveSet(user?.uid)
  const hasMonthlyGoals = goals && (
    (goals.professional?.length ?? 0) > 0 ||
    (goals.personal?.length ?? 0) > 0 ||
    (goals.spiritual?.length ?? 0) > 0
  )

  const todayQuestionIndex = activeSetData && activeSet
    ? getQuestionIndexForToday(
        activeSet.startedAt as { toDate?: () => Date } | Date | undefined,
        activeSetData.questions?.length ?? 0
      )
    : 0
  const todayQuestion = activeSetData?.questions?.[todayQuestionIndex]
  const todayQuestionText = todayQuestion ? getQuestionText(todayQuestion) : ''
  const todayQuestionImage = activeSetData?.coverImageUrl

  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-6">
        <Logo size={40} />
        <div className="flex gap-2 items-center">
          <Bell size={24} strokeWidth={1.5} className="text-[#6896F0]" />
          <Avatar size={36} />
        </div>
      </header>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        <Link
          to="/goals"
          className="flex-shrink-0 w-20 h-20 rounded-full shadow-soft flex flex-col items-center justify-center border-2 relative transition-transform hover:scale-105"
          style={{
            backgroundColor: hasMonthlyGoals ? 'rgba(46, 73, 155, 0.2)' : 'rgba(255, 203, 0, 0.3)',
            borderColor: hasMonthlyGoals ? '#2E499B' : '#FFCB00',
          }}
        >
          {hasMonthlyGoals ? (
            <Check size={28} strokeWidth={2} className="text-[#2E499B]" />
          ) : (
            <Target size={28} strokeWidth={1.5} className="text-[#FF8000]" />
          )}
          <p className="text-xs mt-12 absolute bottom-[-18px]">
            {hasMonthlyGoals ? 'מטרות חודש' : 'מטרות חודש'}
          </p>
        </Link>
        <div className="flex-shrink-0 w-20 h-20 rounded-full bg-[#6896F0]/20 shadow-soft flex flex-col items-center justify-center border-2 border-[#6896F0] relative">
          <ClipboardList size={28} strokeWidth={1.5} className="text-[#6896F0]" />
          <p className="text-xs mt-12 absolute bottom-[-18px]">סט פעיל</p>
        </div>
        <div className="flex-shrink-0 w-20 h-20 rounded-full bg-[#FF8000]/20 shadow-soft flex flex-col items-center justify-center border-2 border-[#FF8000] relative">
          <Calendar size={28} strokeWidth={1.5} className="text-[#FF8000]" />
          <p className="text-xs mt-12 absolute bottom-[-18px]">לפני שנה</p>
        </div>
        <div className="flex-shrink-0 w-20 h-20 rounded-full bg-[#6896F0]/20 shadow-soft flex flex-col items-center justify-center border-2 border-[#6896F0] relative">
          <Check size={28} strokeWidth={2} className="text-[#6896F0]" />
          <p className="text-xs mt-12 absolute bottom-[-18px]">היום</p>
        </div>
      </div>

      {activeSetData && todayQuestionText ? (
        <Link to={`/sets/${activeSetData.id}/write/${todayQuestionIndex}`}>
          <Card className="mb-6 overflow-hidden border-r-4 border-[#FF8000] hover:opacity-95 transition-opacity">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-muted/20">
                {todayQuestionImage || activeSetData.coverImageUrl ? (
                  <img
                    src={todayQuestionImage || activeSetData.coverImageUrl || ''}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {activeSetData.emoji}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-[#FF8000] font-medium">
                  שאלה {todayQuestionIndex + 1} מתוך {activeSetData.questions?.length ?? 0}
                </span>
                <h2 className="text-lg font-bold mt-1 line-clamp-2">{todayQuestionText}</h2>
                <span className="inline-flex items-center gap-1 mt-2 text-primary text-sm">
                  כתבי את תשובתך
                  <ChevronLeft size={14} />
                </span>
              </div>
            </div>
          </Card>
        </Link>
      ) : (
        <Card className="mb-6 border-r-4 border-[#FFCB00]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6896F0] to-[#4663AC] flex items-center justify-center text-white shadow-lg">
              <PenLine size={24} strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-bold">מה עובר עלייך היום?</h2>
            <Link
              to="/write"
              className="w-full bg-[#6896F0] text-white py-3 rounded-[50px] flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-opacity"
            >
              <Plus size={20} strokeWidth={2} />
              כתיבה חדשה
            </Link>
          </div>
        </Card>
      )}

      <h3 className="text-lg font-bold mb-4 text-[#4663AC]">עדכונים אחרונים</h3>
      <div className="flex flex-col gap-4">
        {entries.slice(0, 5).map((entry, i) => {
          const stripColors = ['#2E499B', '#6896F0', '#FF8000', '#FFCB00', '#E22830', '#4663AC', '#FFC07F']
          const stripColor = stripColors[i % stripColors.length]
          return (
          <Link
            key={entry.id}
            to={`/write?date=${entry.date?.toDate?.()?.toISOString?.()?.split('T')[0]}&entryId=${entry.id}`}
          >
            <Card className={`border-r-4 hover:opacity-95 transition-opacity`} style={{ borderRightColor: stripColor }}>
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-muted">
                      {entry.date?.toDate?.()?.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} • היום
                    </span>
                  </div>
                  <h4 className="font-bold mb-1">
                    {entry.questionText ? entry.questionText.slice(0, 40) : stripHtml(entry.text || '').slice(0, 30) || 'ללא כותרת'}
                    {((entry.questionText?.length ?? 0) > 40 || stripHtml(entry.text || '').length > 30) ? '...' : ''}
                  </h4>
                  <p className="text-sm text-muted line-clamp-2">{stripHtml(entry.text || '')}</p>
                </div>
                {entry.imageUrl && (
                  <img
                    src={entry.imageUrl}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                )}
              </div>
            </Card>
          </Link>
          )
        })}
        {entries.length === 0 && (
          <Card>
            <p className="text-muted text-center">עדיין אין רשומות. התחילי לכתוב!</p>
          </Card>
        )}
      </div>
    </div>
  )
}
