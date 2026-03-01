import { NavLink } from 'react-router-dom'
import { PenLine, Calendar, Leaf, Settings } from 'lucide-react'

const tabs = [
  { path: '/', label: 'מסע', Icon: PenLine, activeBg: 'bg-[#6896F0]' },
  { path: '/journal', label: 'יומן', Icon: Calendar, activeBg: 'bg-[#2E499B]' },
  { path: '/sets', label: 'סטים', Icon: Leaf, activeBg: 'bg-[#FF8000]' },
  { path: '/settings', label: 'הגדרות', Icon: Settings, activeBg: 'bg-[#E22830]' },
]

export function BottomTabBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-card shadow-soft rounded-t-3xl p-2 flex justify-around items-center"
      style={{ boxShadow: '0 -2px 12px rgba(0,0,0,0.07)' }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.path === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 px-2 py-2 w-[56px] h-[56px] rounded-full transition-colors ${
              isActive ? `${tab.activeBg} text-white` : 'text-muted'
            }`
          }
        >
          <tab.Icon size={22} strokeWidth={1.5} color="currentColor" />
          <span className="text-[11px] font-sans leading-tight">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
