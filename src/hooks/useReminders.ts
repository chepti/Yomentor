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
        const result = await getFCMToken()
        if (result.token) await saveFCMToken(user.uid, result.token)
      }
    }
    setup()
  }, [user])

  useEffect(() => {
    const unsub = onForegroundMessage((payload) => {
      if (payload && typeof payload === 'object' && 'data' in payload) {
        const data = (payload as { data?: { type?: string; url?: string } }).data
        if (!data?.type) return
        if (data.type === 'monthly_goals') {
          navigate('/goals')
          return
        }
        if (typeof data.url === 'string' && data.url.length > 0) {
          navigate(data.url)
        } else {
          navigate('/write')
        }
      }
    })
    return unsub
  }, [navigate])
}
