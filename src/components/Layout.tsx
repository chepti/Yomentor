import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomTabBar } from './BottomTabBar'
import { InstallPrompt } from './InstallPrompt'
import { NotificationBanner } from './NotificationBanner'
import { useReminders } from '@/hooks/useReminders'
import { useClearExpiredActiveSet } from '@/hooks/useClearExpiredActiveSet'
import { useAuth } from '@/hooks/useAuth'
import { ensureDraftsFromSchedules } from '@/lib/ensureDraftsFromSchedules'

export function Layout() {
  const { user } = useAuth()
  useClearExpiredActiveSet(user?.uid)
  useReminders()
  useEffect(() => {
    if (!user?.uid) return
    void ensureDraftsFromSchedules(user.uid)
  }, [user?.uid])
  return (
    <div className="min-h-screen pb-20">
      <NotificationBanner />
      <Outlet />
      <BottomTabBar />
      <InstallPrompt />
    </div>
  )
}
