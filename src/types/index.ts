import type { Timestamp } from 'firebase/firestore'

export interface UserProfile {
  name: string
  workDays: number[]
  reminderTime: string
  reminderDensity: 'low' | 'medium' | 'high'
  reminderTopics: string[]
  fcmToken?: string
}

export interface Entry {
  id?: string
  text: string
  date: Timestamp
  imageUrl?: string
  setId?: string
  questionId?: number
  questionText?: string
  energyLevel?: number
  archived?: boolean
}

/** שאלה בודדת בסט – עם תמונה אופציונלית */
export interface SetQuestion {
  text: string
  imageUrl?: string
}

/** יוצר הסט */
export interface SetCreator {
  name: string
  imageUrl?: string
}

/** תוכן העשרה והסבר לסט */
export interface SetEnrichment {
  content?: string
  articleUrl?: string
}

export type SetType = 'curated' | 'monthly'

export interface Set {
  id: string
  title: string
  description: string
  shortDescription?: string
  emoji: string
  coverImageUrl?: string
  questions: (string | SetQuestion)[]
  creator?: SetCreator
  enrichment?: SetEnrichment
  type?: SetType
  monthKey?: string
  createdAt: Timestamp
}

export interface ActiveSet {
  setId: string
  currentQuestionIndex: number
  startedAt: Timestamp
}

/** סטים שהמשתמש בחר opt-out (רק לסטים חודשיים) */
export interface UserSetOptOut {
  [setId: string]: boolean
}

/** מטרות חודשיות – מפתח: שנה-חודש עברי (למשל 5786-02) */
export interface MonthlyGoals {
  monthKey: string
  professional: string[]
  personal: string[]
  spiritual: string[]
  completed: {
    professional: boolean[]
    personal: boolean[]
    spiritual: boolean[]
  }
  createdAt?: Timestamp
  updatedAt?: Timestamp
}
