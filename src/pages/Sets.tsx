import { Link } from 'react-router-dom'
import { Plus, ChevronLeft, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSets } from '@/hooks/useSets'
import { useResolvedActiveSet } from '@/hooks/useResolvedActiveSet'
import { useSetOptOuts } from '@/hooks/useSetOptOuts'
import { Card } from '@/components/Card'
import { getHebrewMonthKey } from '@/lib/hebrewDate'

export function Sets() {
  const { user, isAdmin } = useAuth()
  const sets = useSets()
  const { activeSet, activeSetData } = useResolvedActiveSet(user?.uid)
  const optOuts = useSetOptOuts(user?.uid)
  const currentMonthKey = getHebrewMonthKey(new Date())

  const curatedSets = sets.filter((s) => s.type !== 'monthly')
  const monthlySet = sets.find(
    (s) => s.type === 'monthly' && s.monthKey === currentMonthKey
  )

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-6">סטים</h1>

      {activeSetData && (
        <Link to={`/sets/${activeSetData.id}`}>
          <Card className="mb-6 bg-primary/10 border-2 border-primary/30">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <span className="text-xs bg-primary/30 text-primary px-2 py-0.5 rounded-full">
                  סט פעיל
                </span>
                <h2 className="text-lg font-bold mt-2">{activeSetData.title}</h2>
                <p className="text-sm text-muted line-clamp-2">
                  {activeSetData.shortDescription || activeSetData.description}
                </p>
                <div className="flex gap-1 mt-2">
                  {activeSetData.questions?.map((_, i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i <= (activeSet?.currentQuestionIndex ?? 0)
                          ? 'bg-primary'
                          : 'bg-muted/30'
                      }`}
                    />
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 mt-3 text-primary text-sm font-medium">
                  המשך לכתיבה
                  <ChevronLeft size={16} />
                </span>
              </div>
              <div className="flex flex-col items-end gap-2">
                {activeSetData.coverImageUrl ? (
                  <img
                    src={activeSetData.coverImageUrl}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <span className="text-3xl">{activeSetData.emoji}</span>
                )}
              </div>
            </div>
          </Card>
        </Link>
      )}

      {monthlySet && !optOuts[monthlySet.id] && activeSetData?.id !== monthlySet.id && (
        <section className="mb-6">
          <h3 className="font-bold mb-3 text-primary">סט החודש</h3>
          <Link to={`/sets/${monthlySet.id}`}>
            <SetCard set={monthlySet} />
          </Link>
        </section>
      )}

      <section>
        <h3 className="font-bold mb-3">ספריית הסטים</h3>
        <div className="grid gap-4">
          {curatedSets.map((set) => (
            <Link key={set.id} to={`/sets/${set.id}`}>
              <SetCard set={set} />
            </Link>
          ))}
        </div>
      </section>

      {sets.length === 0 && (
        <Card>
          <p className="text-muted text-center mb-4">אין סטים זמינים.</p>
          {isAdmin ? (
            <Link
              to="/admin/sets"
              className="flex items-center justify-center gap-2 w-full bg-primary text-white py-3 rounded-[50px]"
            >
              <Plus size={20} strokeWidth={2} />
              צרי סט חדש
            </Link>
          ) : (
            <p className="text-muted text-center text-sm">אדמין יכול ליצור סטים.</p>
          )}
        </Card>
      )}

      {isAdmin && sets.length > 0 && (
        <Link
          to="/admin/sets"
          className="flex items-center justify-center gap-2 w-full bg-primary/20 text-primary py-3 rounded-[50px] mt-6"
        >
          <Plus size={20} strokeWidth={2} />
          ניהול סטים
        </Link>
      )}
    </div>
  )
}

function SetCard({
  set,
}: {
  set: { id: string; title: string; description?: string; shortDescription?: string; emoji: string; coverImageUrl?: string; creator?: { name: string; imageUrl?: string }; questions?: unknown[] }
}) {
  const daysCount = set.questions?.length ?? 0
  const desc = set.shortDescription || set.description || ''
  const twoSentences = desc.split(/[.!?]/).filter(Boolean).slice(0, 2).join('. ')
  return (
    <Card className="overflow-hidden hover:opacity-95 transition-opacity">
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-muted/20">
          {set.coverImageUrl ? (
            <img
              src={set.coverImageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              {set.emoji}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold">{set.title}</h4>
          <p className="text-sm text-muted">{daysCount} ימים</p>
          {set.creator && (
            <div className="flex items-center gap-1 mt-1">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {set.creator.imageUrl ? (
                  <img src={set.creator.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={12} className="text-primary" />
                )}
              </div>
              <span className="text-xs text-muted">{set.creator.name}</span>
            </div>
          )}
          {twoSentences && (
            <p className="text-sm text-muted mt-1 line-clamp-2">{twoSentences}</p>
          )}
          <span className="inline-flex items-center gap-1 mt-2 text-primary text-sm">
            לפרטים
            <ChevronLeft size={14} />
          </span>
        </div>
      </div>
    </Card>
  )
}
