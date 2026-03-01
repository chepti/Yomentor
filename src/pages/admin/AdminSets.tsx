import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSets } from '@/hooks/useSets'
import { Card } from '@/components/Card'
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getHebrewMonthKey } from '@/lib/hebrewDate'
import type { Set, SetQuestion } from '@/types'

type QuestionInput = { text: string; imageUrl: string }

function toQuestionInput(q: string | SetQuestion): QuestionInput {
  if (typeof q === 'string') return { text: q, imageUrl: '' }
  return { text: q.text, imageUrl: q.imageUrl || '' }
}

function toSetQuestion(q: QuestionInput): SetQuestion | string {
  if (q.imageUrl?.trim()) return { text: q.text.trim(), imageUrl: q.imageUrl.trim() }
  return q.text.trim()
}

export function AdminSets() {
  const sets = useSets()
  const [editing, setEditing] = useState<{ id: string; set: Set & { id: string } } | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [emoji, setEmoji] = useState('🌱')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [creatorName, setCreatorName] = useState('')
  const [creatorImageUrl, setCreatorImageUrl] = useState('')
  const [enrichmentContent, setEnrichmentContent] = useState('')
  const [enrichmentArticleUrl, setEnrichmentArticleUrl] = useState('')
  const [setType, setSetType] = useState<'curated' | 'monthly'>('curated')
  const [monthKey, setMonthKey] = useState('')
  const [questions, setQuestions] = useState<QuestionInput[]>([{ text: '', imageUrl: '' }])

  const addQuestion = () => setQuestions((q) => [...q, { text: '', imageUrl: '' }])
  const removeQuestion = (i: number) =>
    setQuestions((q) => q.filter((_, idx) => idx !== i))
  const updateQuestion = (i: number, field: 'text' | 'imageUrl', v: string) =>
    setQuestions((q) => {
      const next = [...q]
      next[i] = { ...next[i], [field]: v }
      return next
    })

  const resetForm = () => {
    setEditing(null)
    setTitle('')
    setDescription('')
    setShortDescription('')
    setEmoji('🌱')
    setCoverImageUrl('')
    setCreatorName('')
    setCreatorImageUrl('')
    setEnrichmentContent('')
    setEnrichmentArticleUrl('')
    setSetType('curated')
    setMonthKey('')
    setQuestions([{ text: '', imageUrl: '' }])
  }

  const handleSave = async () => {
    const validQuestions = questions
      .map((q) => toSetQuestion(q))
      .filter((q) => (typeof q === 'string' ? q : q.text).trim())
    if (!title.trim() || validQuestions.length === 0) return

    const payload = {
      title: title.trim(),
      description: description.trim(),
      shortDescription: shortDescription.trim() || undefined,
      emoji: emoji.trim() || '🌱',
      coverImageUrl: coverImageUrl.trim() || undefined,
      creator:
        creatorName.trim()
          ? { name: creatorName.trim(), imageUrl: creatorImageUrl.trim() || undefined }
          : undefined,
      enrichment:
        enrichmentContent.trim() || enrichmentArticleUrl.trim()
          ? {
              content: enrichmentContent.trim() || undefined,
              articleUrl: enrichmentArticleUrl.trim() || undefined,
            }
          : undefined,
      type: setType,
      monthKey: setType === 'monthly' ? (monthKey.trim() || getHebrewMonthKey(new Date())) : undefined,
      questions: validQuestions,
    }

    if (editing) {
      await updateDoc(doc(db, 'sets', editing.id), payload)
    } else {
      await addDoc(collection(db, 'sets'), {
        ...payload,
        createdAt: serverTimestamp(),
      })
    }
    resetForm()
  }

  const handleEdit = (set: Set & { id: string }) => {
    setEditing({ id: set.id, set })
    setTitle(set.title)
    setDescription(set.description)
    setShortDescription(set.shortDescription || '')
    setEmoji(set.emoji || '🌱')
    setCoverImageUrl(set.coverImageUrl || '')
    setCreatorName(set.creator?.name || '')
    setCreatorImageUrl(set.creator?.imageUrl || '')
    setEnrichmentContent(set.enrichment?.content || '')
    setEnrichmentArticleUrl(set.enrichment?.articleUrl || '')
    setSetType((set.type as 'curated' | 'monthly') || 'curated')
    setMonthKey(set.monthKey || getHebrewMonthKey(new Date()))
    setQuestions(
      set.questions?.length
        ? set.questions.map((q) => toQuestionInput(q))
        : [{ text: '', imageUrl: '' }]
    )
  }

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק את הסט?')) return
    await deleteDoc(doc(db, 'sets', id))
    resetForm()
  }

  return (
    <div className="p-4 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <Link to="/settings" className="text-primary">
          ← חזרה
        </Link>
        <h1 className="text-xl font-bold">ניהול סטים</h1>
      </header>

      <Card className="mb-6">
        <h3 className="font-bold mb-4">
          {editing ? 'עריכת סט' : 'סט חדש'}
        </h3>
        <input
          type="text"
          placeholder="כותרת"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 rounded-lg bg-bg mb-2"
        />
        <input
          type="text"
          placeholder="תיאור מלא"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 rounded-lg bg-bg mb-2"
        />
        <input
          type="text"
          placeholder="תיאור קצר (2 משפטים)"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          className="w-full p-3 rounded-lg bg-bg mb-2"
        />
        <input
          type="text"
          placeholder="אימוג'י"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          className="w-full p-3 rounded-lg bg-bg mb-2"
        />
        <input
          type="url"
          placeholder="קישור לתמונת כיסוי"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          className="w-full p-3 rounded-lg bg-bg mb-2"
        />
        <div className="mb-2">
          <span className="text-sm font-medium">יוצר הסט</span>
          <input
            type="text"
            placeholder="שם היוצר"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            className="w-full p-3 rounded-lg bg-bg mt-1"
          />
          <input
            type="url"
            placeholder="קישור לתמונת היוצר"
            value={creatorImageUrl}
            onChange={(e) => setCreatorImageUrl(e.target.value)}
            className="w-full p-3 rounded-lg bg-bg mt-1"
          />
        </div>
        <div className="mb-2">
          <span className="text-sm font-medium">העשרה וידע</span>
          <textarea
            placeholder="תוכן הסבר"
            value={enrichmentContent}
            onChange={(e) => setEnrichmentContent(e.target.value)}
            className="w-full p-3 rounded-lg bg-bg mt-1 min-h-[60px]"
          />
          <input
            type="url"
            placeholder="קישור למאמר"
            value={enrichmentArticleUrl}
            onChange={(e) => setEnrichmentArticleUrl(e.target.value)}
            className="w-full p-3 rounded-lg bg-bg mt-1"
          />
        </div>
        <div className="mb-4 flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="setType"
              checked={setType === 'curated'}
              onChange={() => setSetType('curated')}
            />
            לבחירה
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="setType"
              checked={setType === 'monthly'}
              onChange={() => setSetType('monthly')}
            />
            חודשי
          </label>
        </div>
        {setType === 'monthly' && (
          <input
            type="text"
            placeholder="מפתח חודש (למשל 5786-02)"
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
            className="w-full p-3 rounded-lg bg-bg mb-4"
          />
        )}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold">שאלות</span>
            <button
              type="button"
              onClick={addQuestion}
              className="text-primary text-sm"
            >
              + הוספת שאלה
            </button>
          </div>
          {questions.map((q, i) => (
            <div key={i} className="flex flex-col gap-1 mb-3 p-2 rounded-lg bg-bg">
              <input
                type="text"
                placeholder={`שאלה ${i + 1}`}
                value={q.text}
                onChange={(e) => updateQuestion(i, 'text', e.target.value)}
                className="p-2 rounded-lg bg-card"
              />
              <input
                type="url"
                placeholder="קישור לתמונה לשאלה (אופציונלי)"
                value={q.imageUrl}
                onChange={(e) => updateQuestion(i, 'imageUrl', e.target.value)}
                className="p-2 rounded-lg bg-card text-sm"
              />
              <button
                type="button"
                onClick={() => removeQuestion(i)}
                className="text-muted text-sm self-start"
              >
                ✕ הסר שאלה
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-primary text-white py-2 rounded-[50px]"
          >
            {editing ? 'עדכון' : 'יצירה'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-muted"
            >
              ביטול
            </button>
          )}
        </div>
      </Card>

      <h3 className="font-bold mb-4">סטים קיימים</h3>
      <div className="flex flex-col gap-2">
        {sets.map((set) => (
          <Card key={set.id} className="flex justify-between items-center">
            <div>
              <span className="text-xl">{set.emoji}</span>
              <span className="font-bold mr-2">{set.title}</span>
              <span className="text-sm text-muted">
                ({set.questions?.length || 0} שאלות)
              </span>
              {set.type === 'monthly' && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full mr-2">
                  חודשי
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleEdit(set)}
                className="text-primary text-sm"
              >
                עריכה
              </button>
              <button
                type="button"
                onClick={() => handleDelete(set.id)}
                className="text-red-500 text-sm"
              >
                מחיקה
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
