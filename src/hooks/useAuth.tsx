import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  signInWithGoogle,
  signOut,
  onAuthChange,
  getFCMToken,
  requestNotificationPermission,
  saveFCMToken,
} from '@/lib/firebase'
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { UserProfile } from '@/types'

interface AuthContextValue {
  user: import('firebase/auth').User | null
  profile: UserProfile | null
  profileLoaded: boolean
  loading: boolean
  isAdmin: boolean
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<import('firebase/auth').User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsubAuth = onAuthChange(async (firebaseUser) => {
      if (firebaseUser?.isAnonymous) {
        await signOut()
        setUser(null)
        setProfile(null)
        setProfileLoaded(false)
        setLoading(false)
        return
      }
      setUser(firebaseUser)
      setProfileLoaded(!firebaseUser)
      if (!firebaseUser) {
        setProfile(null)
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        const tokenResult = await firebaseUser.getIdTokenResult()
        setIsAdmin(!!tokenResult.claims.admin)
      } catch {
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    })

    return unsubAuth
  }, [])

  useEffect(() => {
    if (!user) return
    setProfileLoaded(false)
    const userRef = doc(db, 'users', user.uid)
    const unsubProfile = onSnapshot(userRef, (snap) => {
      const data = snap.data()
      if (data?.profile) {
        setProfile(data.profile as UserProfile)
      } else {
        setProfile(null)
      }
      setProfileLoaded(true)
    }, (err) => {
      console.error('Profile snapshot error:', err)
      setProfile(null)
      setProfileLoaded(true)
    })
    return unsubProfile
  }, [user?.uid])

  const handleSignInWithGoogle = async () => {
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error('שגיאה בהתחברות גוגל:', err)
      throw err
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, profileLoaded, loading, isAdmin, signInWithGoogle: handleSignInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export async function ensureProfile(uid: string, profileData: Partial<UserProfile>) {
  const userRef = doc(db, 'users', uid)
  const snap = await getDoc(userRef)
  const existing = snap.exists() ? snap.data() : {}
  const profile = (existing.profile as Record<string, unknown>) || {}
  await setDoc(userRef, {
    ...existing,
    profile: { ...profile, ...profileData },
  }, { merge: true })
}

export async function completeOnboarding(uid: string, profileData: UserProfile) {
  await ensureProfile(uid, profileData)
  try {
    const granted = await requestNotificationPermission()
    if (granted) {
      const token = await getFCMToken()
      if (token) await saveFCMToken(uid, token)
    }
  } catch {
    // התראות לא קריטיות – ממשיכים גם אם נכשל
  }
}
