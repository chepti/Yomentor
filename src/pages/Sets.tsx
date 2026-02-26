import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSets } from '@/hooks/useSets'
import { useActiveSet } from '@/hooks/useActiveSet'
import { Card } from '@/components/Card'
import { doc, setDoc } from 'firebase/firestore'
import { serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function Sets() {
  const { user } = useAuth()
  const sets = useSets()
  const activeSet = useActiveSet(user?.uid)
  const [selectedSet, setSelectedSet] = useState<typeof sets[0] | null>(null)

  const activeSetData = activeSet ? sets.find((s) => s.id === activeSet.setId) : null

  const handleStartSet = async (setId: string) => {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), {
      activeSet: {
        setId,
        currentQuestionIndex: 0,
        startedAt: serverTimestamp(),
      },
    }, { merge: true })
    setSelectedSet(null)
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-6">בחרי סט אימון</h1>

      {activeSetData && (
        <Card className="mb-6 bg-primary/10 border-2 border-primary/30">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs bg-primary/30 text-primary px-2 py-0.5 rounded-full">סט פעיל</span>
              <h2 className="text-lg font-bold mt-2">{activeSetData.title}</h2>
              <p className="text-sm text-muted">{activeSetData.description}</p>
              <div className="flex gap-1 mt-2">
                {activeSetData.questions.map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i <= (activeSet?.currentQuestionIndex ?? 0) ? 'bg-primary' : 'bg-muted/30'
                    }`}
                  />
                ))}
              </div>
              <Link
                to="/write"
                className="mt-4 inline-block bg-primary text-white px-6 py-2 rounded-[50px]"
              >
                המשך ←
              </Link>
            </div>
            <span className="text-3xl">{activeSetData.emoji}</span>
          </div>
        </Card>
      )}

      <h3 className="font-bold mb-4">ספריית האימונים</h3>
      <div className="grid grid-cols-2 gap-4">
        {sets.map((set) => (
          <button
            key={set.id}
            type="button"
            onClick={() => setSelectedSet(set)}
            className="bg-card rounded-card shadow-soft p-4 text-right flex flex-col items-center gap-2"
          >
            <span className="text-2xl">{set.emoji}</span>
            <span className="font-bold">{set.title}</span>
            <span className="text-sm text-muted">{set.questions?.length || 0} שאלות</span>
          </button>
        ))}
      </div>

      {sets.length === 0 && (
        <Card>
          <p className="text-muted text-center">אין סטים זמינים. אדמין יכול ליצור סטים.</p>
        </Card>
      )}

      {selectedSet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">{selectedSet.title}</h3>
            <p className="text-sm text-muted mb-4">{selectedSet.description}</p>
            <p className="text-sm mb-4">
              שאלה ראשונה: {selectedSet.questions?.[0] || '-'}
            </p>
            <button
              type="button"
              onClick={() => handleStartSet(selectedSet.id)}
              className="w-full bg-primary text-white py-3 rounded-[50px]"
            >
              התחילי
            </button>
            <button
              type="button"
              onClick={() => setSelectedSet(null)}
              className="w-full mt-2 text-muted py-2"
            >
              ביטול
            </button>
          </Card>
        </div>
      )}
    </div>
  )
}
