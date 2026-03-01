import { Outlet } from 'react-router-dom'
import { BottomTabBar } from './BottomTabBar'
import { InstallPrompt } from './InstallPrompt'
import { NotificationBanner } from './NotificationBanner'
import { useReminders } from '@/hooks/useReminders'

export function Layout() {
  useReminders()
  return (
    <div className="min-h-screen pb-20">
      <NotificationBanner />
      <Outlet />
      <BottomTabBar />
      <InstallPrompt />
    </div>
  )
}
