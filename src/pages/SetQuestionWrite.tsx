import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSets } from '@/hooks/useSets'
import { useActiveSet } from '@/hooks/useActiveSet'
import { toHebrewDate } from '@/lib/hebrewDate'
import { getQuestionText, getQuestionImage } from '@/lib/setUtils'
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { setHasSavedOnce } from '@/hooks/useInstallPrompt'
import { db } from '@/lib/firebase'

export function SetQuestionWrite() {
  const navigate = useNavigate()
  const { setId, questionIndex } = useParams<{ setId: string; questionIndex: string }>()
  const { user } = useAuth()
  const sets = useSets()
  const userActiveSet = useActiveSet(user?.uid)

  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [existingId, setExistingId] = useState<string | null>(null)

  const setData = sets.find((s) => s.id === setId)
  const qIndex = parseInt(questionIndex ?? '0', 10)
  const question = setData?.questions?.[qIndex]
  const questionText = question ? getQuestionText(question) : ''
  const questionImage = question ? getQuestionImage(question) : setData?.coverImageUrl
  const totalQuestions = setData?.questions?.length ?? 0
  const date = new Date()

  useEffect(() => {
    if (!user || !setId || !setData) return
    if (userActiveSet?.setId === setId) return
    if (setData.type === 'monthly') {
      setDoc(doc(db, 'users', user.uid), {
        activeSet: {
          setId,
          currentQuestionIndex: qIndex,
          startedAt: serverTimestamp(),
        },
      }, { merge: true })
    }
  }, [user?.uid, setId, setData?.type, userActiveSet?.setId, qIndex])

  useEffect(() => {
    if (!user || !setId || setData == null) return
    const loadEntry = async () => {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const end = new Date()
      end.setHours(23, 59, 59, 999)
      const q = query(
        collection(db, 'users', user.uid, 'entries'),
        where('setId', '==', setId),
        where('questionId', '==', qIndex),
        where('date', '>=', start),
        where('date', '<=', end)
      )
      const snap = await getDocs(q)
      if (!snap.empty) {
        const entryDoc = snap.docs[0]
        setExistingId(entryDoc.id)
        setText(entryDoc.data().text || '')
      }
    }
    loadEntry()
  }, [user, setId, qIndex, setData])

  const handleSave = async () => {
    if (!user || !setId || !setData) return
    setSaving(true)
    try {
      const d = new Date()
      d.setHours(12, 0, 0, 0)
      if (existingId) {
        await updateDoc(doc(db, 'users', user.uid, 'entries', existingId), {
          text,
          questionText,
        })
      } else {
        await addDoc(collection(db, 'users', user.uid, 'entries'), {
          text,
          date: d,
          setId,
          questionId: qIndex,
          questionText,
        })
      }
      setHasSavedOnce()
      const nextIndex = qIndex + 1
      const userSnap = await getDoc(doc(db, 'users', user.uid))
      const existingActive = userSnap.data()?.activeSet
      await setDoc(doc(db, 'users', user.uid), {
        activeSet: {
          setId,
          currentQuestionIndex: Math.min(nextIndex, totalQuestions - 1),
          startedAt: existingActive?.startedAt ?? new Date(),
        },
      }, { merge: true })
      if (nextIndex < totalQuestions) {
        navigate(`/sets/${setId}/write/${nextIndex}`)
      } else {
        navigate('/')
      }
    } finally {
      setSaving(false)
    }
  }

  if (!setData || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-muted">סט או שאלה לא נמצאו</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {(questionImage || setData.coverImageUrl) && (
        <div
          className="absolute inset-0 bg-cover bg-center -z-10"
          style={{ backgroundImage: `url(${questionImage || setData.coverImageUrl})` }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}
      <div className="relative flex flex-col min-h-screen z-0">
        <header className="flex justify-between items-center p-4 text-white drop-shadow-lg">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1 rounded-full hover:bg-white/20"
          >
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <span className="text-sm drop-shadow">
            {toHebrewDate(date)}
          </span>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-1 rounded-full hover:bg-white/20"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </header>

        <div className="flex-1 flex flex-col px-4 pb-6">
          <div className="text-white drop-shadow-lg mb-4">
            <p className="text-sm opacity-90">
              שאלה {qIndex + 1} מתוך {totalQuestions}
            </p>
            <h1 className="text-xl font-bold mt-2 leading-relaxed">
              {questionText}
            </h1>
          </div>

          <div className="flex-1 flex flex-col mt-auto">
            <div className="bg-card/95 backdrop-blur rounded-2xl p-4 shadow-lg min-h-[180px]">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="כתבי כאן את תשובתך..."
                className="w-full min-h-[160px] bg-transparent border-0 resize-none focus:outline-none text-text"
              />
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-4 w-full bg-primary text-white py-3 rounded-[50px] font-bold disabled:opacity-60"
            >
              {saving ? 'שומר...' : 'שמירה'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
