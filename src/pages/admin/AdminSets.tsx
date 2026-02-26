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
import type { Set } from '@/types'

export function AdminSets() {
  const sets = useSets()
  const [editing, setEditing] = useState<{ id: string; set: Set } | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('🌱')
  const [questions, setQuestions] = useState<string[]>([''])

  const addQuestion = () => setQuestions((q) => [...q, ''])
  const removeQuestion = (i: number) =>
    setQuestions((q) => q.filter((_, idx) => idx !== i))
  const updateQuestion = (i: number, v: string) =>
    setQuestions((q) => {
      const next = [...q]
      next[i] = v
      return next
    })

  const resetForm = () => {
    setEditing(null)
    setTitle('')
    setDescription('')
    setEmoji('🌱')
    setQuestions([''])
  }

  const handleSave = async () => {
    const validQuestions = questions.filter((q) => q.trim())
    if (!title.trim() || validQuestions.length === 0) return

    if (editing) {
      await updateDoc(doc(db, 'sets', editing.id), {
        title: title.trim(),
        description: description.trim(),
        emoji: emoji.trim() || '🌱',
        questions: validQuestions,
      })
    } else {
      await addDoc(collection(db, 'sets'), {
        title: title.trim(),
        description: description.trim(),
        emoji: emoji.trim() || '🌱',
        questions: validQuestions,
        createdAt: serverTimestamp(),
      })
    }
    resetForm()
  }

  const handleEdit = (set: (Set & { id: string })) => {
    setEditing({ id: set.id, set })
    setTitle(set.title)
    setDescription(set.description)
    setEmoji(set.emoji || '🌱')
    setQuestions(set.questions?.length ? set.questions : [''])
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
          placeholder="תיאור"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 rounded-lg bg-bg mb-2"
        />
        <input
          type="text"
          placeholder="אימוג'י"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          className="w-full p-3 rounded-lg bg-bg mb-4"
        />
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
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder={`שאלה ${i + 1}`}
                value={q}
                onChange={(e) => updateQuestion(i, e.target.value)}
                className="flex-1 p-2 rounded-lg bg-bg"
              />
              <button
                type="button"
                onClick={() => removeQuestion(i)}
                className="text-muted"
              >
                ✕
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
