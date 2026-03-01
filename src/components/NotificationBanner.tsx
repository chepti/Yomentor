import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { onForegroundMessage } from '@/lib/firebase'

interface NotificationPayload {
  notification?: { title?: string; body?: string }
  data?: { type?: string }
}

/** באנר זמני – מציג התראות כשהן מגיעות כשהאפליקציה פתוחה (foreground) */
export function NotificationBanner() {
  const [msg, setMsg] = useState<{ title: string; body: string } | null>(null)

  useEffect(() => {
    const unsub = onForegroundMessage((payload: unknown) => {
      if (payload && typeof payload === 'object') {
        const p = payload as NotificationPayload
        const notif = p.notification
        const title = notif?.title || 'התראה'
        const body = notif?.body || ''
        setMsg({ title, body })
        setTimeout(() => setMsg(null), 5000)
      }
    })
    return unsub
  }, [])

  if (!msg) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 mx-4 mt-2 p-4 rounded-card bg-card shadow-soft border border-primary/20 flex gap-3 items-start"
      style={{ maxWidth: '430px', marginLeft: 'auto', marginRight: 'auto' }}
      dir="rtl"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text">{msg.title}</p>
        {msg.body && <p className="text-sm text-muted mt-0.5">{msg.body}</p>}
      </div>
      <button
        type="button"
        onClick={() => setMsg(null)}
        className="shrink-0 p-1 rounded-full hover:bg-black/5 text-muted"
        aria-label="סגור"
      >
        <X size={18} strokeWidth={1.5} />
      </button>
    </div>
  )
}
