import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  getDocFromServer,
  setDoc,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { AppAccessConfig, UserProfile } from '@/types'

interface AuthContextValue {
  user: import('firebase/auth').User | null
  profile: UserProfile | null
  profileLoaded: boolean
  loading: boolean
  /** Custom Claim admin או ברשימת adminUids */
  isFullAdmin: boolean
  /** אדמין מלא או עורך (רשימת editorUids) – ניהול סטים */
  canManageSets: boolean
  /** טעינת רשימות גישה (רק כשאין claim admin) – לנתיבי ניהול סטים */
  staffLoading: boolean
  adminUids: string[]
  editorUids: string[]
  /** שמות תצוגה לפי UID (מ-config/access) */
  displayNames: Record<string, string>
  /** רענון מ-Firestore אחרי עדכון צוות בשרת (כשה-snapshot מתעכב) */
  refreshAccessConfig: () => Promise<void>
  /** עדכון מקומי מהתשובה של updateTeamAccess (מומלץ אחרי שמירה) */
  applyAccessSnapshot: (data: AppAccessConfig) => void
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const emptyDisplayNames: Record<string, string> = {}
const emptyAccess: AppAccessConfig = {
  adminUids: [],
  editorUids: [],
  displayNames: emptyDisplayNames,
}

function normalizeUidList(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
}

function normalizeDisplayNames(v: unknown): Record<string, string> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  const out: Record<string, string> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof k !== 'string' || !k.trim()) continue
    if (typeof val !== 'string') continue
    const t = val.trim()
    if (t) out[k.trim()] = t
  }
  return out
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<import('firebase/auth').User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [claimAdmin, setClaimAdmin] = useState(false)
  const [access, setAccess] = useState<AppAccessConfig | null>(null)
  const [accessLoaded, setAccessLoaded] = useState(false)

  useEffect(() => {
    const unsubAuth = onAuthChange(async (firebaseUser) => {
      if (firebaseUser?.isAnonymous) {
        await signOut()
        setUser(null)
        setProfile(null)
        setProfileLoaded(false)
        setClaimAdmin(false)
        setLoading(false)
        return
      }
      setUser(firebaseUser)
      setProfileLoaded(!firebaseUser)
      if (!firebaseUser) {
        setProfile(null)
        setClaimAdmin(false)
        setLoading(false)
        return
      }

      try {
        const tokenResult = await firebaseUser.getIdTokenResult()
        setClaimAdmin(!!tokenResult.claims.admin)
      } catch {
        setClaimAdmin(false)
      } finally {
        setLoading(false)
      }
    })

    return unsubAuth
  }, [])

  useEffect(() => {
    if (!user) {
      setAccess(null)
      setAccessLoaded(true)
      return
    }
    setAccessLoaded(false)
    const unsub = onSnapshot(
      doc(db, 'config', 'access'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data()
          setAccess({
            adminUids: normalizeUidList(d.adminUids),
            editorUids: normalizeUidList(d.editorUids),
            displayNames: normalizeDisplayNames(d.displayNames),
          })
        } else {
          setAccess(emptyAccess)
        }
        setAccessLoaded(true)
      },
      (err) => {
        console.error('config/access snapshot:', err)
        setAccess(emptyAccess)
        setAccessLoaded(true)
      }
    )
    return unsub
  }, [user?.uid])

  const applyAccessSnapshot = useCallback((data: AppAccessConfig) => {
    setAccess({
      adminUids: normalizeUidList(data.adminUids),
      editorUids: normalizeUidList(data.editorUids),
      displayNames: normalizeDisplayNames(data.displayNames),
    })
    setAccessLoaded(true)
  }, [])

  const refreshAccessConfig = useCallback(async () => {
    if (!user) return
    const ref = doc(db, 'config', 'access')
    try {
      const snap = await getDocFromServer(ref)
      if (snap.exists()) {
        const d = snap.data()
        applyAccessSnapshot({
          adminUids: normalizeUidList(d.adminUids),
          editorUids: normalizeUidList(d.editorUids),
          displayNames: normalizeDisplayNames(d.displayNames),
        })
      } else {
        setAccess(emptyAccess)
        setAccessLoaded(true)
      }
    } catch (e) {
      console.error('refreshAccessConfig (server):', e)
      try {
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const d = snap.data()
          applyAccessSnapshot({
            adminUids: normalizeUidList(d.adminUids),
            editorUids: normalizeUidList(d.editorUids),
            displayNames: normalizeDisplayNames(d.displayNames),
          })
        } else {
          setAccess(emptyAccess)
          setAccessLoaded(true)
        }
      } catch (e2) {
        console.error('refreshAccessConfig (cache):', e2)
      }
    }
  }, [user, applyAccessSnapshot])

  const { isFullAdmin, canManageSets, staffLoading } = useMemo(() => {
    if (!user) {
      return {
        isFullAdmin: false,
        canManageSets: false,
        staffLoading: false,
      }
    }
    const a: AppAccessConfig = access ?? emptyAccess
    const inAdmins = a.adminUids.includes(user.uid)
    const inEditors = a.editorUids.includes(user.uid)
    const full = claimAdmin || (accessLoaded && inAdmins)
    const sets = full || (accessLoaded && inEditors)
    const wait = !claimAdmin && !accessLoaded
    return {
      isFullAdmin: full,
      canManageSets: sets,
      staffLoading: wait,
    }
  }, [user, claimAdmin, access, accessLoaded])

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

  const adminUids = access?.adminUids ?? []
  const editorUids = access?.editorUids ?? []
  const displayNames = access?.displayNames ?? emptyDisplayNames

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        profileLoaded,
        loading,
        isFullAdmin,
        canManageSets,
        staffLoading,
        adminUids,
        editorUids,
        displayNames,
        refreshAccessConfig,
        applyAccessSnapshot,
        signInWithGoogle: handleSignInWithGoogle,
      }}
    >
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
      const result = await getFCMToken()
      if (result.token) await saveFCMToken(uid, result.token)
    }
  } catch {
    // התראות לא קריטיות – ממשיכים גם אם נכשל
  }
}
