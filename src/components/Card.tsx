import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-card bg-card shadow-soft p-4 ${className}`}
      style={{ borderRadius: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
    >
      {children}
    </div>
  )
}
