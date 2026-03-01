import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSets } from '@/hooks/useSets'
import { useActiveSet } from '@/hooks/useActiveSet'
import { useSetOptOuts } from '@/hooks/useSetOptOuts'
import { getSetDaysCount } from '@/lib/setUtils'
import { Card } from '@/components/Card'
import { doc, setDoc, updateDoc, getDoc, deleteField, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function SetDetail() {
  const navigate = useNavigate()
  const { setId } = useParams<{ setId: string }>()
  const { user } = useAuth()
  const sets = useSets()
  const activeSet = useActiveSet(user?.uid)

  const setData = sets.find((s) => s.id === setId)
  const optOuts = useSetOptOuts(user?.uid)
  const isActive = activeSet?.setId === setId
  const hasOptedOut = !!optOuts[setId ?? '']
  const daysCount = setData ? getSetDaysCount(setData) : 0

  const handleOptIn = async () => {
    if (!user || !setId) return
    const userRef = doc(db, 'users', user.uid)
    const snap = await getDoc(userRef)
    const data = snap.data() || {}
    const optOutsData = { ...(data.setOptOuts || {}) }
    delete optOutsData[setId]
    await updateDoc(userRef, {
      setOptOuts: optOutsData,
      activeSet: {
        setId,
        currentQuestionIndex: 0,
        startedAt: serverTimestamp(),
      },
    })
  }

  const handleRegister = async () => {
    if (!user || !setId) return
    if (hasOptedOut) await handleOptIn()
    await setDoc(doc(db, 'users', user.uid), {
      activeSet: {
        setId,
        currentQuestionIndex: 0,
        startedAt: serverTimestamp(),
      },
    }, { merge: true })
    navigate('/sets')
  }

  const handleOptOut = async () => {
    if (!user || !setId) return
    if (!confirm('לבטל את הסט החודשי? לא תקבלי יותר שאלות מהסט הזה.')) return
    const userRef = doc(db, 'users', user.uid)
    const snap = await getDoc(userRef)
    const data = snap.data() || {}
    const optOuts = { ...(data.setOptOuts || {}), [setId]: true }
    const updates: Record<string, unknown> = { setOptOuts: optOuts }
    if (data.activeSet?.setId === setId) {
      updates.activeSet = deleteField()
    }
    await updateDoc(userRef, updates)
    navigate('/sets')
  }

  if (!setData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-muted">סט לא נמצא</p>
      </div>
    )
  }

  const isMonthly = setData.type === 'monthly'

  return (
    <div className="min-h-screen bg-bg p-4 pb-8">
      <header className="flex justify-between items-center mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-primary p-1"
        >
          <ArrowLeft size={24} strokeWidth={1.5} />
        </button>
        <h1 className="text-lg font-bold">פרטי הסט</h1>
        <div className="w-10" />
      </header>

      {setData.coverImageUrl && (
        <div className="rounded-2xl overflow-hidden mb-4 -mx-4">
          <img
            src={setData.coverImageUrl}
            alt=""
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{setData.emoji}</span>
          <h2 className="text-xl font-bold">{setData.title}</h2>
        </div>
        <div className="flex-shrink-0 px-4 py-2 rounded-[50px] bg-primary text-white font-bold text-sm shadow-md">
          {daysCount} ימים
        </div>
      </div>

      <p className="text-muted mb-6">{setData.description}</p>

      <div className="flex flex-col gap-3 mb-6">
        {!isActive ? (
          <>
            <button
              type="button"
              onClick={handleRegister}
              className="w-full bg-primary text-white py-3 rounded-[50px] font-bold shadow-md"
            >
              התחל אתגר
            </button>
            {isMonthly && (
              <button
                type="button"
                onClick={hasOptedOut ? handleOptIn : handleOptOut}
                className="w-full py-2 text-muted text-sm"
              >
                {hasOptedOut ? 'הצטרפי לסט החודשי' : 'לא מעוניינת בסט זה'}
              </button>
            )}
          </>
        ) : (
          <Link
            to={`/sets/${setId}/write/${activeSet?.currentQuestionIndex ?? 0}`}
            className="w-full bg-primary text-white py-3 rounded-[50px] font-bold text-center shadow-md"
          >
            המשך לכתיבה
          </Link>
        )}
      </div>

      {setData.enrichment && (setData.enrichment.content || setData.enrichment.articleUrl) && (
        <Card className="mb-6">
          <h3 className="font-bold mb-2">העשרה וידע</h3>
          {setData.enrichment.content && (
            <p className="text-sm text-muted mb-3">{setData.enrichment.content}</p>
          )}
          {setData.enrichment.articleUrl && (
            <a
              href={setData.enrichment.articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary text-sm"
            >
              <ExternalLink size={16} />
              קישור למאמר
            </a>
          )}
        </Card>
      )}

      {setData.creator && (
        <div className="flex items-center gap-3 pt-4 border-t border-muted/20">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            {setData.creator.imageUrl ? (
              <img src={setData.creator.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={24} className="text-primary" />
            )}
          </div>
          <span className="font-medium">{setData.creator.name}</span>
        </div>
      )}
    </div>
  )
}
