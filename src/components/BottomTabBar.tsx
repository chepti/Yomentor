import { NavLink } from 'react-router-dom'

const tabs = [
  { path: '/', label: 'כתוב', icon: '✍️' },
  { path: '/journal', label: 'יומן', icon: '📅' },
  { path: '/sets', label: 'סטים', icon: '🌱' },
  { path: '/settings', label: 'הגדרות', icon: '⚙️' },
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
            `flex flex-col items-center gap-1 px-4 py-2 rounded-[50px] transition-colors ${
              isActive ? 'bg-primary text-white' : 'text-muted'
            }`
          }
        >
          <span className="text-lg">{tab.icon}</span>
          <span className="text-sm font-sans">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
