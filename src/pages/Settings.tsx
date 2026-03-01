import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Settings as SettingsIcon, Download, ChevronLeft } from 'lucide-react'
import { useAuth, ensureProfile } from '@/hooks/useAuth'
import { signOut } from '@/lib/firebase'
import { Card } from '@/components/Card'
import { Pill } from '@/components/Pill'
import { useEntries } from '@/hooks/useEntries'

const DAY_NAMES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const DENSITY_OPTIONS = [
  { value: 'low' as const, label: 'מינימלי' },
  { value: 'medium' as const, label: 'מאוזן' },
  { value: 'high' as const, label: 'מלא' },
]
const TOPICS = ['וולביינג', 'ניהול זמן', 'הכרת טוב', 'שחרור', 'חוזקות']

export function Settings() {
  const { user, profile, isAdmin } = useAuth()
  const entries = useEntries(user?.uid)
  const [name, setName] = useState(profile?.name || '')
  const [workDays, setWorkDays] = useState<number[]>(profile?.workDays ?? [0, 1, 2, 3, 4])
  const [reminderTime, setReminderTime] = useState(profile?.reminderTime || '07:30')
  const [density, setDensity] = useState(profile?.reminderDensity || 'medium')
  const [topics, setTopics] = useState<string[]>(profile?.reminderTopics || [])

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setWorkDays(profile.workDays)
      setReminderTime(profile.reminderTime)
      setDensity(profile.reminderDensity)
      setTopics(profile.reminderTopics)
    }
  }, [profile])

  const toggleDay = (d: number) => {
    const next = workDays.includes(d)
      ? workDays.filter((x) => x !== d)
      : [...workDays, d].sort((a, b) => a - b)
    setWorkDays(next)
    if (user) ensureProfile(user.uid, { workDays: next })
  }

  const toggleTopic = (t: string) => {
    const next = topics.includes(t) ? topics.filter((x) => x !== t) : [...topics, t]
    setTopics(next)
    if (user) ensureProfile(user.uid, { reminderTopics: next })
  }

  const handleSave = () => {
    if (!user) return
    ensureProfile(user.uid, {
      name,
      reminderTime,
      reminderDensity: density,
    })
  }

  const handleExport = () => {
    const text = entries
      .map((e) => {
        const d = e.date?.toDate?.()
        const dateStr = d ? d.toLocaleDateString('he-IL') : ''
        return `[${dateStr}]\n${e.text}\n\n`
      })
      .join('')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `יומן-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">הגדרות</h1>
        <SettingsIcon size={28} strokeWidth={1.5} className="text-icon-primary" />
      </header>

      <section className="mb-6">
        <h3 className="text-sm text-muted mb-2">חשבון והעדפות</h3>
        <Card className="mb-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-muted text-sm">מחובר עם גוגל</span>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>
        </Card>
        <Card className="mb-2">
          <div className="flex justify-between items-center">
            <span>פרופיל משתמש</span>
            <ChevronLeft size={20} strokeWidth={1.5} className="text-icon-secondary" />
          </div>
        </Card>
        <Card className="mb-2">
          <div className="flex justify-between items-center">
            <span>שפת ממשק</span>
            <span className="flex items-center gap-1">עברית <ChevronLeft size={20} strokeWidth={1.5} className="text-icon-secondary" /></span>
          </div>
        </Card>
        <h3 className="text-sm text-muted mt-4 mb-2">ימי עבודה פעילים</h3>
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
      </section>

      <section className="mb-6">
        <h3 className="text-sm text-muted mb-2">תזכורות והתראות</h3>
        <Card className="mb-2">
          <div className="flex justify-between items-center">
            <span>שעת תזכורת</span>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              onBlur={handleSave}
              className="bg-transparent border-0"
            />
          </div>
        </Card>
        <h3 className="text-sm text-muted mt-4 mb-2">צפיפות תזכורות</h3>
        <div className="flex gap-2">
          {DENSITY_OPTIONS.map((opt) => (
            <Pill
              key={opt.value}
              active={density === opt.value}
              onClick={() => {
                setDensity(opt.value)
                if (user) ensureProfile(user.uid, { reminderDensity: opt.value })
              }}
            >
              {opt.label}
            </Pill>
          ))}
        </div>
        <h3 className="text-sm text-muted mt-4 mb-2">נושאי התראה</h3>
        <div className="flex flex-col gap-2">
          {TOPICS.map((t) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={topics.includes(t)}
                onChange={() => toggleTopic(t)}
              />
              <span>{t}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <button
          type="button"
          onClick={handleExport}
          className="w-full bg-card rounded-card shadow-soft p-4 flex items-center gap-2"
        >
          <Download size={20} strokeWidth={1.5} className="text-icon-primary" />
          ייצוא נתונים
        </button>
      </section>

      {isAdmin && (
        <section className="mb-6">
          <Link
            to="/admin/sets"
            className="block w-full bg-primary/20 text-primary rounded-card shadow-soft p-4 text-center"
          >
            ניהול סטים
          </Link>
        </section>
      )}

      <button
        type="button"
        onClick={() => signOut()}
        className="w-full text-muted py-4"
      >
        התנתקות
      </button>
    </div>
  )
}
