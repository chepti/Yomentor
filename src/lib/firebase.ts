import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  type User,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

let messaging: Messaging | null = null
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app)
  } catch {
    messaging = null
  }
}

export { messaging }

export function getCurrentUser(): User | null {
  return auth.currentUser
}

const googleProvider = new GoogleAuthProvider()

/** התחברות עם חשבון גוגל. שומר סשן ב-localStorage לתקופה ארוכה. */
export async function signInWithGoogle() {
  await setPersistence(auth, browserLocalPersistence)
  return signInWithPopup(auth, googleProvider)
}

export async function signOut() {
  return firebaseSignOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export async function getFCMToken(): Promise<string | null> {
  if (!messaging || !VAPID_KEY) return null
  try {
    const registration = await navigator.serviceWorker.ready
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
    return token
  } catch {
    return null
  }
}

export async function saveFCMToken(uid: string, token: string) {
  const { doc, getDoc, setDoc } = await import('firebase/firestore')
  const userRef = doc(db, 'users', uid)
  const snap = await getDoc(userRef)
  const existing = snap.exists() ? snap.data() : {}
  const profile = (existing.profile as Record<string, unknown>) || {}
  await setDoc(userRef, {
    ...existing,
    profile: { ...profile, fcmToken: token },
  }, { merge: true })
}

export function onForegroundMessage(callback: (payload: unknown) => void) {
  if (!messaging) return () => {}
  return onMessage(messaging, callback)
}

/** שליחת התראת בדיקה – לשימוש בפיתוח בלבד */
export async function sendTestNotification(): Promise<{ success: boolean }> {
  const functions = getFunctions(app)
  const fn = httpsCallable<unknown, { success: boolean }>(functions, 'sendTestNotification')
  const result = await fn()
  return result.data
}
