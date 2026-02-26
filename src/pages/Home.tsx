import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Avatar } from '@/components/Avatar'
import { Card } from '@/components/Card'
import { useAuth } from '@/hooks/useAuth'
import { useEntries } from '@/hooks/useEntries'

export function Home() {
  const { user } = useAuth()
  const entries = useEntries(user?.uid)

  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-6">
        <Logo size={40} />
        <div className="flex gap-2 items-center">
          <span className="text-2xl">🔔</span>
          <Avatar size={36} />
        </div>
      </header>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        <div className="flex-shrink-0 w-20 h-20 rounded-full bg-card shadow-soft flex items-center justify-center border-2 border-primary/30">
          <span className="text-2xl">📋</span>
          <p className="text-xs mt-12 absolute">סט פעיל</p>
        </div>
        <div className="flex-shrink-0 w-20 h-20 rounded-full bg-card shadow-soft flex items-center justify-center border-2 border-accent/50">
          <span className="text-2xl">📅</span>
          <p className="text-xs mt-12 absolute">לפני שנה</p>
        </div>
        <div className="flex-shrink-0 w-20 h-20 rounded-full bg-card shadow-soft flex items-center justify-center border-2 border-primary">
          <span className="text-2xl">✓</span>
          <p className="text-xs mt-12 absolute">היום</p>
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-xl">
            ✍️
          </div>
          <h2 className="text-lg font-bold">מה עובר עלייך היום?</h2>
          <Link
            to="/write"
            className="w-full bg-primary text-white py-3 rounded-[50px] flex items-center justify-center gap-2"
          >
            <span>+</span>
            כתיבה חדשה
          </Link>
        </div>
      </Card>

      <h3 className="text-lg font-bold mb-4">עדכונים אחרונים</h3>
      <div className="flex flex-col gap-4">
        {entries.slice(0, 5).map((entry) => (
          <Link key={entry.id} to={`/write?date=${entry.date?.toDate?.()?.toISOString?.()?.split('T')[0]}`}>
            <Card>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-muted">
                  {entry.date?.toDate?.()?.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} • היום
                </span>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">יומן אישי</span>
              </div>
              <h4 className="font-bold mb-1">{entry.text?.slice(0, 30) || 'ללא כותרת'}...</h4>
              <p className="text-sm text-muted line-clamp-2">{entry.text}</p>
            </Card>
          </Link>
        ))}
        {entries.length === 0 && (
          <Card>
            <p className="text-muted text-center">עדיין אין רשומות. התחילי לכתוב!</p>
          </Card>
        )}
      </div>
    </div>
  )
}
