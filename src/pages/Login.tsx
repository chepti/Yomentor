import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Logo } from '@/components/Logo'
import type { AuthError } from 'firebase/auth'

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

export function Login() {
  const { user, profile, loading, signInWithGoogle } = useAuth()

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-bg"><p className="text-text">טוען...</p></div>
  if (user && profile) return <Navigate to="/" replace />
  if (user && !profile) return <Navigate to="/onboarding" replace />
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  const handleSignIn = async () => {
    setError(null)
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      const code = (err as AuthError)?.code
      if (code === 'auth/popup-closed-by-user') {
        setError(null)
      } else if (code === 'auth/credential-already-in-use') {
        setError('חשבון זה כבר קיים במערכת. נסה להתחבר עם חשבון אחר.')
      } else {
        setError('שגיאה בהתחברות. ודא שהפעלת Google ב-Firebase Console.')
      }
    } finally {
      setSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      <Logo size={80} className="mb-4" />
      <h1 className="text-2xl font-bold text-center mb-2">יומנטור</h1>
      <p className="text-muted text-center mb-8">מרימים את חווית הלמידה</p>

      <p className="text-muted text-sm text-center mb-6 max-w-xs">
        התחברי עם חשבון Google כדי להשתמש ביומן האישי
      </p>

      <button
        type="button"
        onClick={handleSignIn}
        disabled={signingIn}
        className="flex items-center justify-center gap-3 w-full max-w-xs bg-white dark:bg-card border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-text py-4 px-6 rounded-card shadow-soft transition-colors disabled:opacity-50"
      >
        <GoogleIcon />
        <span>{signingIn ? 'מתחברת...' : 'התחברי עם Google'}</span>
      </button>

      {error && (
        <p className="mt-4 text-sm text-red-500 text-center max-w-xs">{error}</p>
      )}
    </div>
  )
}
