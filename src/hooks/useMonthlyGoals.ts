import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getHebrewMonthKey } from '@/lib/hebrewDate'
import type { MonthlyGoals } from '@/types'

const EMPTY_GOALS: Omit<MonthlyGoals, 'monthKey'> = {
  professional: [],
  personal: [],
  spiritual: [],
  completed: { professional: [], personal: [], spiritual: [] },
}

function createEmptyForMonth(monthKey: string): MonthlyGoals {
  return {
    monthKey,
    ...EMPTY_GOALS,
  }
}

export function useMonthlyGoals(uid: string | undefined, monthKey?: string) {
  const key = monthKey ?? getHebrewMonthKey(new Date())
  const [goals, setGoals] = useState<MonthlyGoals | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setGoals(null)
      setLoading(false)
      return
    }
    const ref = doc(db, 'users', uid, 'monthlyGoals', key)
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        setGoals({ monthKey: key, ...snap.data() } as MonthlyGoals)
      } else {
        setGoals(createEmptyForMonth(key))
      }
      setLoading(false)
    })
  }, [uid, key])

  const save = async (data: Partial<MonthlyGoals>) => {
    if (!uid || !goals) return
    const ref = doc(db, 'users', uid, 'monthlyGoals', key)
    const merged = { ...goals, ...data, monthKey: key }
    await setDoc(ref, { ...merged, updatedAt: serverTimestamp() })
    setGoals(merged)
  }

  return { goals, loading, save }
}

/** מחזיר את כל המפתחות של חודשים שיש בהם מטרות + החודש הנוכחי */
export function useMonthlyGoalsKeys(uid: string | undefined) {
  const [keys, setKeys] = useState<string[]>([])
  const currentKey = getHebrewMonthKey(new Date())

  useEffect(() => {
    if (!uid) {
      setKeys([currentKey])
      return
    }
    // כרגע מחזירים רק את החודש הנוכחי – ניתן להרחיב עם collection query
    setKeys([currentKey])
  }, [uid, currentKey])

  return { keys, currentKey }
}
