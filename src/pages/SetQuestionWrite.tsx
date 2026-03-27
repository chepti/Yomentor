import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import { RichTextEditor } from '@/components/RichTextEditor'
import { useAuth } from '@/hooks/useAuth'
import { useSets } from '@/hooks/useSets'
import { useActiveSet } from '@/hooks/useActiveSet'
import { toHebrewDate, toGregorianDateShort } from '@/lib/hebrewDate'
import { getQuestionText } from '@/lib/setUtils'
import { escapeHtml, extractAnswerFromSetEntry } from '@/lib/stripHtml'
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
  const questionImage = setData?.coverImageUrl
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
        const d = entryDoc.data()
        setExistingId(entryDoc.id)
        const fullText = d.text || ''
        setText(extractAnswerFromSetEntry(fullText, d.questionText || questionText))
      }
    }
    loadEntry()
  }, [user, setId, qIndex, setData])

  const handleSave = async () => {
    if (!user || !setId || !setData) return
    setSaving(true)
    try {
      const questionBlock = questionText
        ? `<p><strong>${escapeHtml(questionText)}</strong></p>`
        : ''
      const textToSave = questionBlock + text
      const d = new Date()
      d.setHours(12, 0, 0, 0)
      if (existingId) {
        await updateDoc(doc(db, 'users', user.uid, 'entries', existingId), {
          text: textToSave,
          questionText,
        })
      } else {
        await addDoc(collection(db, 'users', user.uid, 'entries'), {
          text: textToSave,
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

  const coverUrl = questionImage || setData.coverImageUrl

  return (
    <div className="min-h-screen flex flex-col relative">
      {coverUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center -z-10"
          style={{ backgroundImage: `url(${coverUrl})` }}
        >
          {/* שכבת הכהיה כפולה: למעלה כהה יותר לתאריך ולשאלה */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/40" />
        </div>
      ) : (
        /* רקע כהה כשאין תמונת סט – מונע אזור עליון בהיר */
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#1a2d5c] via-[#2E499B] to-[#3d5a9e]" />
      )}
      <div className="relative flex flex-col min-h-screen z-0">
        <header className="flex justify-between items-center p-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1 rounded-full hover:bg-white/20"
          >
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <span className="text-sm drop-shadow">
            {toHebrewDate(date)} ({toGregorianDateShort(date)})
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
          {/* רקע כהה לשאלה – קונטרסט טוב לקריאה */}
          <div className="rounded-2xl bg-black/45 backdrop-blur-sm px-4 py-4 mb-4 text-white shadow-lg">
            <p className="text-sm text-white/95">
              שאלה {qIndex + 1} מתוך {totalQuestions}
            </p>
            <h1 className="text-xl font-bold mt-2 leading-relaxed text-white">
              {questionText}
            </h1>
          </div>

          <div className="flex-1 flex flex-col mt-auto">
            <div className="bg-card/95 backdrop-blur rounded-2xl p-4 shadow-lg min-h-[180px]">
              <RichTextEditor
                value={text}
                onChange={setText}
                placeholder="כתבי כאן את תשובתך..."
                minHeight="160px"
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
