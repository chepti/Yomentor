import { type ReactNode } from 'react'

interface PillProps {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
}

export function Pill({ children, active = false, onClick, className = '' }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-pill px-4 py-2 font-sans transition-colors ${className}`}
      style={{
        borderRadius: '50px',
        backgroundColor: active ? 'var(--primary)' : 'var(--card)',
        color: active ? 'white' : 'var(--text)',
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {children}
    </button>
  )
}
