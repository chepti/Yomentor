import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, completeOnboarding } from '@/hooks/useAuth'
import { Logo } from '@/components/Logo'
import { Card } from '@/components/Card'
import { Pill } from '@/components/Pill'
import type { UserProfile } from '@/types'

const DAY_NAMES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

export function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [workDays, setWorkDays] = useState<number[]>([0, 1, 2, 3, 4])
  const [reminderTime, setReminderTime] = useState('07:30')

  const toggleDay = (d: number) => {
    setWorkDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)
    )
  }

  const handleComplete = async () => {
    if (!user) return
    const profile: UserProfile = {
      name,
      workDays,
      reminderTime,
      reminderDensity: 'medium',
      reminderTopics: [],
    }
    await completeOnboarding(user.uid, profile)
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-bg p-6 flex flex-col items-center">
      {step === 1 && (
        <div className="flex flex-col items-center gap-8 mt-16">
          <Logo size={80} />
          <h1 className="text-2xl font-bold text-center">יומנטור</h1>
          <p className="text-muted text-center">מרימים את חווית הלמידה</p>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="bg-primary text-white px-8 py-3 rounded-[50px]"
          >
            התחילי
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4">מה השם שלך?</h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="השם שלי"
            className="w-full p-4 rounded-card bg-card shadow-soft border-0"
          />
          <button
            type="button"
            onClick={() => setStep(3)}
            className="mt-6 w-full bg-primary text-white py-3 rounded-[50px]"
          >
            המשך
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4">ימי עבודה פעילים</h2>
          <div className="flex flex-wrap gap-2">
            {DAY_NAMES.map((label, i) => (
              <Pill
                key={i}
                active={workDays.includes(i)}
                onClick={() => toggleDay(i)}
              >
                {label}
              </Pill>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep(4)}
            className="mt-6 w-full bg-primary text-white py-3 rounded-[50px]"
          >
            המשך
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4">שעת תזכורת</h2>
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="w-full p-4 rounded-card bg-card shadow-soft border-0"
          />
          <button
            type="button"
            onClick={() => setStep(5)}
            className="mt-6 w-full bg-primary text-white py-3 rounded-[50px]"
          >
            המשך
          </button>
        </div>
      )}

      {step === 5 && (
        <Card className="w-full max-w-sm">
          <h2 className="text-xl font-bold mb-2">התראות</h2>
          <p className="text-muted text-sm mb-6">
            נשלח לך תזכורת לכתיבה ביומן כדי לעזור לך לשמור על הרגל יומי.
          </p>
          <button
            type="button"
            onClick={handleComplete}
            className="w-full bg-primary text-white py-3 rounded-[50px]"
          >
            אפשר התראות
          </button>
          <button
            type="button"
            onClick={handleComplete}
            className="w-full mt-2 text-muted py-2"
          >
            דלג
          </button>
        </Card>
      )}
    </div>
  )
}
