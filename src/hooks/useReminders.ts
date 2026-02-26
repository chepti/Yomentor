import { useEffect } from 'react'
import { getFCMToken, requestNotificationPermission, onForegroundMessage } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { saveFCMToken } from '@/lib/firebase'
import { useNavigate } from 'react-router-dom'

export function useReminders() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    const setup = async () => {
      const granted = await requestNotificationPermission()
      if (granted) {
        const token = await getFCMToken()
        if (token) await saveFCMToken(user.uid, token)
      }
    }
    setup()
  }, [user])

  useEffect(() => {
    const unsub = onForegroundMessage((payload) => {
      if (payload && typeof payload === 'object' && 'data' in payload) {
        const data = (payload as { data?: { type?: string } }).data
        if (data?.type === 'daily' || data?.type === 'set_question' || data?.type === 'inspiration') {
          navigate('/write')
        }
      }
    })
    return unsub
  }, [navigate])
}
