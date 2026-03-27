import { useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { lookupUidByEmail, updateTeamAccess } from '@/lib/firebase'
import { Card } from '@/components/Card'

function shortUid(uid: string) {
  if (uid.length <= 12) return uid
  return `${uid.slice(0, 8)}…${uid.slice(-4)}`
}

async function resolveToUid(raw: string): Promise<string> {
  const s = raw.trim()
  if (!s) throw new Error('ריק')
  if (s.includes('@')) {
    const { uid } = await lookupUidByEmail(s)
    return uid
  }
  return s
}

export function TeamAccessSection() {
  const { user, isFullAdmin, adminUids, editorUids } = useAuth()
  const [input, setInput] = useState('')
  const [role, setRole] = useState<'admin' | 'editor'>('editor')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  if (!isFullAdmin || !user) return null

  const persist = async (nextAdmins: string[], nextEditors: string[]) => {
    await updateTeamAccess(nextAdmins, nextEditors)
  }

  const handleAdd = async () => {
    setMsg(null)
    setBusy(true)
    try {
      const uid = await resolveToUid(input)
      if (uid === user.uid) {
        setMsg('זה המזהה שלך – כבר יש לך גישה')
        return
      }
      let admins = [...adminUids]
      let editors = [...editorUids]
      admins = admins.filter((u) => u !== uid)
      editors = editors.filter((u) => u !== uid)
      if (role === 'admin') admins.push(uid)
      else editors.push(uid)
      await persist(admins, editors)
      setInput('')
      setMsg('נשמר')
    } catch (e) {
      const err = e as { code?: string; message?: string }
      if (err.code === 'functions/permission-denied' || err.message?.includes('permission-denied')) {
        setMsg('אין הרשאה בשרת. ודאי שפרסת את ה-Functions (updateTeamAccess) ושיש לך claim אדמין.')
      } else if (err.code === 'functions/not-found' || err.message?.includes('לא נמצא')) {
        setMsg('לא נמצא משתמש – ודאי שהתחבר לפחות פעם אחת עם גוגל')
      } else {
        setMsg(err.message || 'שגיאה בהוספה')
      }
    } finally {
      setBusy(false)
    }
  }

  const removeUid = async (uid: string, from: 'admin' | 'editor') => {
    if (uid === user.uid && from === 'admin') {
      setMsg('לא ניתן להסיר את עצמך מרשימת האדמינים')
      return
    }
    setMsg(null)
    try {
      if (from === 'admin') {
        await persist(
          adminUids.filter((u) => u !== uid),
          editorUids
        )
      } else {
        await persist(
          adminUids,
          editorUids.filter((u) => u !== uid)
        )
      }
    } catch (e) {
      const err = e as { code?: string; message?: string }
      if (err.code === 'functions/permission-denied') {
        setMsg('אין הרשאה. פרסי Functions ונסי שוב.')
      } else {
        setMsg('שגיאה בהסרה')
      }
    }
  }

  return (
    <section className="mb-6" dir="rtl">
      <h3 className="text-sm text-muted mb-2">ניהול צוות</h3>
      <p className="text-xs text-muted mb-3">
        אדמין מלא: ניהול רשימות והגדרות. עורך: יצירה ועריכת סטים בלבד (בלי מסך זה).
      </p>
      <Card className="mb-3">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">הוספת משתמש</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="מייל (גוגל) או UID"
            className="w-full p-3 rounded-lg bg-bg border border-gray-100"
            disabled={busy}
          />
          <div className="flex gap-2 flex-wrap items-center">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'editor')}
              className="p-2 rounded-lg bg-bg border border-gray-100"
              disabled={busy}
            >
              <option value="editor">עורך (סטים בלבד)</option>
              <option value="admin">אדמין מלא</option>
            </select>
            <button
              type="button"
              onClick={handleAdd}
              disabled={busy || !input.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-[50px] bg-primary text-white disabled:opacity-50"
            >
              <UserPlus size={18} strokeWidth={1.5} />
              {busy ? 'מוסיף…' : 'הוספה'}
            </button>
          </div>
          {msg && <p className="text-sm text-muted">{msg}</p>}
        </div>
      </Card>

      <Card className="mb-2">
        <span className="text-sm font-medium block mb-2">אדמינים מלאים (UID)</span>
        <ul className="space-y-2">
          {adminUids.length === 0 && (
            <li className="text-sm text-muted">אין – רק מי שיש לו claim אדמין בפרויקט</li>
          )}
          {adminUids.map((uid) => (
            <li
              key={uid}
              className="flex justify-between items-center gap-2 text-sm py-1 border-b border-gray-100 last:border-0"
            >
              <code className="text-xs break-all" dir="ltr">
                {uid}
              </code>
              <button
                type="button"
                onClick={() => removeUid(uid, 'admin')}
                className="shrink-0 text-muted hover:text-red-600"
                aria-label={`הסר ${shortUid(uid)}`}
              >
                <X size={18} />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <span className="text-sm font-medium block mb-2">עורכים – סטים בלבד (UID)</span>
        <ul className="space-y-2">
          {editorUids.length === 0 && (
            <li className="text-sm text-muted">אין עורכים</li>
          )}
          {editorUids.map((uid) => (
            <li
              key={uid}
              className="flex justify-between items-center gap-2 text-sm py-1 border-b border-gray-100 last:border-0"
            >
              <code className="text-xs break-all" dir="ltr">
                {uid}
              </code>
              <button
                type="button"
                onClick={() => removeUid(uid, 'editor')}
                className="shrink-0 text-muted hover:text-red-600"
                aria-label={`הסר ${shortUid(uid)}`}
              >
                <X size={18} />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}
