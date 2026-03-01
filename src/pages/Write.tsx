import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, X, Camera, Sparkles, Trash2, Archive } from 'lucide-react'
import { RichTextEditor } from '@/components/RichTextEditor'
import { useAuth } from '@/hooks/useAuth'
import { toHebrewDate } from '@/lib/hebrewDate'
import { Card } from '@/components/Card'
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  deleteField,
} from 'firebase/firestore'
import { setHasSavedOnce } from '@/hooks/useInstallPrompt'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { getEntryDisplayHtml } from '@/lib/stripHtml'

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
  const entryIdParam = searchParams.get('entryId')
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [saving, setSaving] = useState(false)
  const [existingId, setExistingId] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null) // תצוגה מיידית לפני העלאה
  const pendingImageRef = useRef<Promise<string> | null>(null)

  const date = dateParam ? new Date(dateParam) : new Date()

  // ניקוי object URL כשמחליפים תמונה או עוזבים
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    if (!user || !dateParam) return
    const loadEntry = async () => {
      if (entryIdParam) {
        const docSnap = await getDoc(doc(db, 'users', user.uid, 'entries', entryIdParam))
        if (docSnap.exists()) {
          const d = docSnap.data()
          setExistingId(docSnap.id)
          setText(getEntryDisplayHtml({ text: d.text, questionText: d.questionText }) || '')
          setImageUrl(d.imageUrl || null)
        }
      } else {
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
    }
    loadEntry()
  }, [user, dateParam, entryIdParam])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      // המתנה להעלאת תמונה אם עדיין בתהליך
      let urlToSave = imageUrl
      if (pendingImageRef.current) {
        urlToSave = await pendingImageRef.current
        pendingImageRef.current = null
      }
      if (existingId) {
        await updateDoc(doc(db, 'users', user.uid, 'entries', existingId), {
          text,
          imageUrl: urlToSave != null ? urlToSave : deleteField(),
        })
      } else {
        const d = dateParam ? new Date(dateParam) : new Date()
        d.setHours(12, 0, 0, 0)
        await addDoc(collection(db, 'users', user.uid, 'entries'), {
          text,
          date: d,
          ...(urlToSave != null && { imageUrl: urlToSave }),
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
    setImageError(null)
    // תצוגה מקדימה מיידית – המשתמש רואה את התמונה מיד
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setImageUrl(null) // איפוס עד שיושלם העלאה
    setUploadingImage(true)
    const uploadPromise = (async () => {
      const storageRef = ref(storage, `users/${user.uid}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setImageUrl(url)
      return url
    })()
    pendingImageRef.current = uploadPromise
    try {
      await uploadPromise
      URL.revokeObjectURL(objectUrl)
      setPreviewUrl(null)
    } catch (err) {
      console.error('שגיאה בהעלאת תמונה:', err)
      pendingImageRef.current = null
      setImageError(
        err instanceof Error
          ? err.message
          : 'שגיאה בהעלאת התמונה. ודא שהרצת: firebase deploy --only storage'
      )
    } finally {
      setUploadingImage(false)
    }
    e.target.value = '' // איפוס כדי לאפשר בחירה חוזרת של אותה תמונה
  }

  const applyTemplate = (t: string) => {
    setText((prev) => (prev ? `${prev}\n\n${t}` : t))
    setShowTemplates(false)
  }

  const handleDelete = async () => {
    if (!user || !existingId || !confirm('למחוק את הפוסט?')) return
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'entries', existingId))
      navigate('/')
    } catch (err) {
      console.error('שגיאה במחיקה:', err)
    }
  }

  const handleArchive = async () => {
    if (!user || !existingId) return
    try {
      await updateDoc(doc(db, 'users', user.uid, 'entries', existingId), { archived: true })
      navigate('/')
    } catch (err) {
      console.error('שגיאה בהעברה לארכיון:', err)
    }
  }

  const hasImage = !!(imageUrl || previewUrl)

  return (
    <div className="min-h-screen bg-bg p-4">
      <header className="flex justify-between items-center mb-4">
        <button type="button" onClick={() => navigate(-1)} className="text-primary">
          <ArrowLeft size={22} strokeWidth={1.5} />
        </button>
        <span className="text-sm text-muted">{toHebrewDate(date)}</span>
        <button type="button" onClick={() => navigate('/')} className="text-muted">
          <X size={22} strokeWidth={1.5} />
        </button>
      </header>

      <Card className="min-h-[200px] mb-4">
        {hasImage && (
          <div className="mb-4 -mx-4 -mt-4 rounded-t-[24px] overflow-hidden">
            <img
              src={imageUrl || previewUrl || ''}
              alt=""
              className="w-full max-h-[240px] object-cover"
            />
            {uploadingImage && (
              <span className="block p-2 text-xs text-muted bg-card">מעלה תמונה...</span>
            )}
          </div>
        )}
        <RichTextEditor
          key={existingId ?? 'new'}
          value={text}
          onChange={setText}
          placeholder="כתבי כאן..."
        />
        {imageError && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {imageError}
          </p>
        )}
      </Card>

      {existingId && (
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={handleArchive}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-[50px] bg-card text-muted border border-muted/30"
          >
            <Archive size={18} strokeWidth={1.5} />
            העברה לארכיון
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-[50px] text-[#E22830] border border-[#E22830]/50 hover:bg-[#E22830]/10"
          >
            <Trash2 size={18} strokeWidth={1.5} />
            מחיקה
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <label className="w-10 h-10 rounded-full bg-card shadow-soft flex items-center justify-center cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImagePick}
              className="hidden"
            />
            <Camera size={20} strokeWidth={1.5} className="text-icon-primary" />
          </label>
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-10 h-10 rounded-full bg-card shadow-soft flex items-center justify-center"
          >
            <Sparkles size={20} strokeWidth={1.5} className="text-icon-highlight" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploadingImage}
          className="bg-primary text-white px-6 py-2 rounded-[50px] disabled:opacity-60"
        >
          {saving ? 'שומר...' : uploadingImage ? 'מעלה תמונה...' : 'שמירה'}
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
