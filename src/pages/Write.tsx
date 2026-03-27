import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, X, Camera, Sparkles, Trash2, Archive, Bookmark } from 'lucide-react'
import { RichTextEditor } from '@/components/RichTextEditor'
import { useAuth } from '@/hooks/useAuth'
import { toHebrewDate, toGregorianDateShort } from '@/lib/hebrewDate'
import { Card } from '@/components/Card'
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  serverTimestamp,
} from 'firebase/firestore'
import { setHasSavedOnce } from '@/hooks/useInstallPrompt'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { getEntryDisplayHtml } from '@/lib/stripHtml'
import { getMergedTemplateBody } from '@/lib/mergeTemplateBody'
import { getPageTemplateById, toLocalDateKey } from '@/lib/pageTemplates'
import { usePageTemplatePreferences } from '@/hooks/usePageTemplatePreferences'

const PROMPT_TEMPLATES = [
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
  const entryIdParam = searchParams.get('entryId')
  const draftIdParam = searchParams.get('draftId')
  const templateIdParam = searchParams.get('templateId')
  const dateParam = searchParams.get('date')

  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [saving, setSaving] = useState(false)
  const [existingId, setExistingId] = useState<string | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const pendingImageRef = useRef<Promise<string> | null>(null)

  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleDays, setScheduleDays] = useState(14)

  const { saveCustomBody, saving: savingPreference } = usePageTemplatePreferences(user?.uid)

  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? new Date(dateParam + 'T12:00:00')
      : new Date()

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    if (!user) return

    const run = async () => {
      if (entryIdParam) {
        const docSnap = await getDoc(doc(db, 'users', user.uid, 'entries', entryIdParam))
        if (docSnap.exists()) {
          const d = docSnap.data()
          setExistingId(docSnap.id)
          setDraftId(null)
          setText(getEntryDisplayHtml({ text: d.text, questionText: d.questionText }) || '')
          setImageUrl(d.imageUrl || null)
        }
        return
      }

      if (draftIdParam) {
        const docSnap = await getDoc(doc(db, 'users', user.uid, 'drafts', draftIdParam))
        if (docSnap.exists()) {
          const d = docSnap.data()
          setExistingId(null)
          setDraftId(docSnap.id)
          setText(d.text || '')
          setImageUrl(d.imageUrl || null)
        }
        return
      }

      if (templateIdParam) {
        setExistingId(null)
        setDraftId(null)
        const body = await getMergedTemplateBody(user.uid, templateIdParam)
        setText(body)
        setImageUrl(null)
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return null
        })
        pendingImageRef.current = null
        return
      }

      setExistingId(null)
      setDraftId(null)
      setText('')
      setImageUrl(null)
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      pendingImageRef.current = null
    }

    void run()
  }, [user, entryIdParam, draftIdParam, templateIdParam])

  const resolveDateForSave = () => {
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const d = new Date(dateParam)
      d.setHours(12, 0, 0, 0)
      return d
    }
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    return d
  }

  const resolveDayKey = () => {
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return dateParam
    return toLocalDateKey(new Date())
  }

  const finishAfterSave = () => {
    setHasSavedOnce()
    navigate('/')
  }

  const handleSaveEntry = async () => {
    if (!user) return
    setSaving(true)
    try {
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
        const d = resolveDateForSave()
        await addDoc(collection(db, 'users', user.uid, 'entries'), {
          text,
          date: d,
          ...(urlToSave != null && { imageUrl: urlToSave }),
        })
      }
      finishAfterSave()
    } finally {
      setSaving(false)
    }
  }

  const handlePublishDraft = async () => {
    if (!user || !draftId) return
    setSaving(true)
    try {
      let urlToSave = imageUrl
      if (pendingImageRef.current) {
        urlToSave = await pendingImageRef.current
        pendingImageRef.current = null
      }
      const draftSnap = await getDoc(doc(db, 'users', user.uid, 'drafts', draftId))
      const dayKey = (draftSnap.data()?.dayKey as string) || resolveDayKey()
      const d = new Date(dayKey + 'T12:00:00')
      await addDoc(collection(db, 'users', user.uid, 'entries'), {
        text,
        date: d,
        ...(urlToSave != null && { imageUrl: urlToSave }),
      })
      await deleteDoc(doc(db, 'users', user.uid, 'drafts', draftId))
      finishAfterSave()
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateDraft = async () => {
    if (!user || !draftId) return
    setSaving(true)
    try {
      let urlToSave = imageUrl
      if (pendingImageRef.current) {
        urlToSave = await pendingImageRef.current
        pendingImageRef.current = null
      }
      await updateDoc(doc(db, 'users', user.uid, 'drafts', draftId), {
        text,
        imageUrl: urlToSave != null ? urlToSave : deleteField(),
        updatedAt: serverTimestamp(),
      })
      finishAfterSave()
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNewDraft = async (withSchedule: boolean) => {
    if (!user) return
    setSaving(true)
    try {
      let urlToSave = imageUrl
      if (pendingImageRef.current) {
        urlToSave = await pendingImageRef.current
        pendingImageRef.current = null
      }
      const dayKey = resolveDayKey()
      const d = new Date(dayKey + 'T12:00:00')
      let scheduleId: string | undefined
      if (withSchedule && templateIdParam) {
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        const end = new Date(start)
        end.setDate(end.getDate() + Math.max(1, Math.min(60, scheduleDays)))
        end.setHours(23, 59, 59, 999)
        const schedRef = await addDoc(collection(db, 'users', user.uid, 'templateSchedules'), {
          templateId: templateIdParam,
          startDate: start,
          endDate: end,
          createdAt: serverTimestamp(),
        })
        scheduleId = schedRef.id
      }
      await addDoc(collection(db, 'users', user.uid, 'drafts'), {
        text,
        dayKey,
        date: d,
        templateId: templateIdParam || undefined,
        scheduleId,
        status: 'draft',
        imageUrl: urlToSave ?? undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      finishAfterSave()
    } finally {
      setSaving(false)
    }
  }

  const handleSaveFromTemplatePublish = async () => {
    if (!user) return
    setSaving(true)
    try {
      let urlToSave = imageUrl
      if (pendingImageRef.current) {
        urlToSave = await pendingImageRef.current
        pendingImageRef.current = null
      }
      const d = resolveDateForSave()
      await addDoc(collection(db, 'users', user.uid, 'entries'), {
        text,
        date: d,
        ...(urlToSave != null && { imageUrl: urlToSave }),
      })
      finishAfterSave()
    } finally {
      setSaving(false)
    }
  }

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setImageError(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setImageUrl(null)
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
    e.target.value = ''
  }

  const applyPromptTemplate = (t: string) => {
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

  const handleDeleteDraft = async () => {
    if (!user || !draftId || !confirm('למחוק את הטיוטה?')) return
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'drafts', draftId))
      navigate('/')
    } catch (err) {
      console.error('שגיאה במחיקת טיוטה:', err)
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

  const handleSavePersonalTemplate = async () => {
    if (!templateIdParam || !text.trim()) return
    await saveCustomBody(templateIdParam, text)
  }

  const hasImage = !!(imageUrl || previewUrl)

  const isEditingPublishedEntry = !!existingId
  const isEditingDraft = !!draftId
  const isFromTemplateNew = !!templateIdParam && !isEditingPublishedEntry && !isEditingDraft

  const editorKey = existingId || draftId || templateIdParam || 'new'

  const tplMeta = templateIdParam ? getPageTemplateById(templateIdParam) : undefined

  return (
    <div className="min-h-screen bg-bg p-4">
      <header className="flex justify-between items-center mb-4">
        <button type="button" onClick={() => navigate(-1)} className="text-primary">
          <ArrowLeft size={22} strokeWidth={1.5} />
        </button>
        <span className="text-sm text-muted">
          {toHebrewDate(date)} ({toGregorianDateShort(date)})
        </span>
        <button type="button" onClick={() => navigate('/')} className="text-muted">
          <X size={22} strokeWidth={1.5} />
        </button>
      </header>

      {tplMeta && isFromTemplateNew && (
        <p className="text-sm text-muted mb-2 flex items-center gap-2">
          <span className="text-lg" aria-hidden>
            {tplMeta.emoji}
          </span>
          {tplMeta.title}
        </p>
      )}

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
          key={editorKey}
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

      {isFromTemplateNew && (
        <Card className="mb-4">
          <h4 className="font-bold mb-2 text-sm">חזרה יומית כטיוטה (אופציונלי)</h4>
          <label className="flex items-center gap-2 text-sm mb-2">
            <input
              type="checkbox"
              checked={scheduleEnabled}
              onChange={(e) => setScheduleEnabled(e.target.checked)}
            />
            ליצור טיוטה כל יום בטווח שבועות (נשמר כטיוטה; לא ביומן עד פרסום)
          </label>
          {scheduleEnabled && (
            <div className="flex items-center gap-2 text-sm">
              <span>מספר ימים</span>
              <input
                type="number"
                min={1}
                max={60}
                value={scheduleDays}
                onChange={(e) => setScheduleDays(parseInt(e.target.value, 10) || 14)}
                className="w-16 rounded-lg border border-muted/40 px-2 py-1 bg-bg"
              />
            </div>
          )}
        </Card>
      )}

      <div className="flex justify-between items-start gap-2 mb-4">
        <div className="flex gap-2">
          <div className="flex flex-col gap-2">
            <label className="w-10 h-10 rounded-full bg-card shadow-soft flex items-center justify-center cursor-pointer shrink-0">
              <input type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
              <Camera size={20} strokeWidth={1.5} className="text-icon-primary" />
            </label>
            {isEditingPublishedEntry && (
              <>
                <button
                  type="button"
                  onClick={handleArchive}
                  className="w-10 h-10 rounded-full bg-card shadow-soft flex items-center justify-center text-muted border border-muted/25 hover:bg-muted/15"
                  aria-label="העברה לארכיון"
                  title="העברה לארכיון"
                >
                  <Archive size={20} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-10 h-10 rounded-full bg-card shadow-soft flex items-center justify-center text-[#E22830] border border-[#E22830]/25 hover:bg-[#E22830]/8"
                  aria-label="מחיקה"
                  title="מחיקה"
                >
                  <Trash2 size={20} strokeWidth={1.5} />
                </button>
              </>
            )}
            {isEditingDraft && (
              <button
                type="button"
                onClick={handleDeleteDraft}
                className="w-10 h-10 rounded-full bg-card shadow-soft flex items-center justify-center text-[#E22830] border border-[#E22830]/25 hover:bg-[#E22830]/8"
                aria-label="מחיקת טיוטה"
                title="מחיקת טיוטה"
              >
                <Trash2 size={20} strokeWidth={1.5} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-10 h-10 rounded-full bg-card shadow-soft flex items-center justify-center shrink-0 self-start"
            aria-label="הצעות לכתיבה"
          >
            <Sparkles size={20} strokeWidth={1.5} className="text-icon-highlight" />
          </button>
          {templateIdParam && (
            <button
              type="button"
              onClick={() => void handleSavePersonalTemplate()}
              disabled={savingPreference || !text.trim()}
              className="w-10 h-10 rounded-full bg-card shadow-soft flex items-center justify-center shrink-0 self-start disabled:opacity-50"
              aria-label="שמירת גרסה אישית לתבנית"
              title="שמירת גרסה אישית לתבנית"
            >
              <Bookmark size={20} strokeWidth={1.5} className="text-primary" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 items-stretch">
          {isEditingDraft && (
            <>
              <button
                type="button"
                onClick={() => void handlePublishDraft()}
                disabled={saving || uploadingImage}
                className="bg-primary text-white px-4 py-2 rounded-[50px] disabled:opacity-60 text-sm"
              >
                {saving ? 'שומר...' : 'פרסום ליומן'}
              </button>
              <button
                type="button"
                onClick={() => void handleUpdateDraft()}
                disabled={saving || uploadingImage}
                className="bg-primary/20 text-primary px-4 py-2 rounded-[50px] disabled:opacity-60 text-sm"
              >
                {saving ? 'שומר...' : 'שמירת טיוטה'}
              </button>
            </>
          )}

          {isFromTemplateNew && (
            <>
              <button
                type="button"
                onClick={() => void handleSaveFromTemplatePublish()}
                disabled={saving || uploadingImage}
                className="bg-primary text-white px-4 py-2 rounded-[50px] disabled:opacity-60 text-sm"
              >
                {saving ? 'שומר...' : 'פרסום ליומן'}
              </button>
              <button
                type="button"
                onClick={() => void handleSaveNewDraft(scheduleEnabled)}
                disabled={saving || uploadingImage}
                className="bg-primary/20 text-primary px-4 py-2 rounded-[50px] disabled:opacity-60 text-sm"
              >
                {saving ? 'שומר...' : scheduleEnabled ? 'שמירה כטיוטה + לוח זמנים' : 'שמירה כטיוטה'}
              </button>
            </>
          )}

          {!isEditingDraft && !isFromTemplateNew && (
            <button
              type="button"
              onClick={() => void handleSaveEntry()}
              disabled={saving || uploadingImage}
              className="self-start bg-primary text-white px-6 py-2 rounded-[50px] disabled:opacity-60"
            >
              {saving ? 'שומר...' : uploadingImage ? 'מעלה תמונה...' : 'שמירה'}
            </button>
          )}
        </div>
      </div>

      {showTemplates && (
        <Card>
          <h4 className="font-bold mb-2">הצעות לכתיבה</h4>
          <div className="flex flex-wrap gap-2">
            {PROMPT_TEMPLATES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => applyPromptTemplate(t)}
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
