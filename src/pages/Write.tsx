import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { toHebrewDate } from '@/lib/hebrewDate'
import { Card } from '@/components/Card'
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { setHasSavedOnce } from '@/hooks/useInstallPrompt'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'

const TEMPLATES = [
  'מה שימח אותי היום?',
  'על מה אני מודה?',
  'מה הצלחתי להשיג?',
  'איך אני מרגישה עכשיו?',
  'מה אני רוצה לזכור מהיום?',
]

export function Write() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const dateParam = searchParams.get('date')
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [saving, setSaving] = useState(false)
  const [existingId, setExistingId] = useState<string | null>(null)

  const date = dateParam ? new Date(dateParam) : new Date()

  useEffect(() => {
    if (!user || !dateParam) return
    const loadEntry = async () => {
      const start = new Date(dateParam)
      start.setHours(0, 0, 0, 0)
      const end = new Date(dateParam)
      end.setHours(23, 59, 59, 999)
      const q = query(
        collection(db, 'users', user.uid, 'entries'),
        where('date', '>=', start),
        where('date', '<=', end)
      )
      const snap = await getDocs(q)
      if (!snap.empty) {
        const entryDoc = snap.docs[0]
        setExistingId(entryDoc.id)
        setText(entryDoc.data().text || '')
        setImageUrl(entryDoc.data().imageUrl || null)
      }
    }
    loadEntry()
  }, [user, dateParam])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      if (existingId) {
        await updateDoc(doc(db, 'users', user.uid, 'entries', existingId), {
          text,
          imageUrl: imageUrl || undefined,
        })
      } else {
        const d = dateParam ? new Date(dateParam) : new Date()
        d.setHours(12, 0, 0, 0)
        await addDoc(collection(db, 'users', user.uid, 'entries'), {
          text,
          date: d,
          imageUrl: imageUrl || undefined,
        })
      }
      setHasSavedOnce()
      navigate('/')
    } finally {
      setSaving(false)
    }
  }

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const storageRef = ref(storage, `users/${user.uid}/${Date.now()}_${file.name}`)
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)
    setImageUrl(url)
  }

  const applyTemplate = (t: string) => {
    setText((prev) => (prev ? `${prev}\n\n${t}` : t))
    setShowTemplates(false)
  }

  return (
    <div className="min-h-screen bg-bg p-4">
      <header className="flex justify-between items-center mb-4">
        <button type="button" onClick={() => navigate(-1)} className="text-primary">
          ←
        </button>
        <span className="text-sm text-muted">{toHebrewDate(date)}</span>
        <button type="button" onClick={() => navigate('/')} className="text-muted">
          ✕
        </button>
      </header>

      <Card className="min-h-[200px] mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="כתבי כאן..."
          className="w-full min-h-[180px] bg-transparent border-0 resize-none focus:outline-none"
        />
        {imageUrl && (
          <img src={imageUrl} alt="" className="w-24 h-24 object-cover rounded-lg mt-2" />
        )}
      </Card>

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <label className="w-10 h-10 rounded-full bg-card shadow-soft flex items-center justify-center cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImagePick}
              className="hidden"
            />
            📷
          </label>
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-10 h-10 rounded-full bg-card shadow-soft flex items-center justify-center"
          >
            ✨
          </button>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white px-6 py-2 rounded-[50px]"
        >
          {saving ? 'שומר...' : 'שמירה'}
        </button>
      </div>

      {showTemplates && (
        <Card>
          <h4 className="font-bold mb-2">הצעות לכתיבה</h4>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => applyTemplate(t)}
                className="px-4 py-2 rounded-[50px] bg-primary/20 text-primary text-sm"
              >
                {t}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
