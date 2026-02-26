import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  signInAnon,
  onAuthChange,
  getFCMToken,
  requestNotificationPermission,
  saveFCMToken,
} from '@/lib/firebase'
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { UserProfile } from '@/types'

interface AuthContextValue {
  user: import('firebase/auth').User | null
  profile: UserProfile | null
  loading: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<import('firebase/auth').User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      if (!firebaseUser) {
        setProfile(null)
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        const tokenResult = await firebaseUser.getIdTokenResult()
        setIsAdmin(!!tokenResult.claims.admin)

        const profileSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
        const data = profileSnap.data()
        if (data?.profile) {
          setProfile(data.profile as UserProfile)
        } else {
          setProfile(null)
        }
      } catch {
        setProfile(null)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    })

    return unsub
  }, [])

  useEffect(() => {
    if (!user) {
      signInAnon().catch(() => setLoading(false))
    }
  }, [user])

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin }}>
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
  const granted = await requestNotificationPermission()
  if (granted) {
    const token = await getFCMToken()
    if (token) await saveFCMToken(uid, token)
  }
}
