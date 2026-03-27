import type { Timestamp } from 'firebase/firestore'

/** ניהול צוות – רשימות UID ב-Firestore (config/access) */
export interface AppAccessConfig {
  adminUids: string[]
  editorUids: string[]
  /** שמות תצוגה (UID → שם); לא משמש לאימות גישה */
  displayNames?: Record<string, string>
}

export interface UserProfile {
  name: string
  workDays: number[]
  reminderTime: string
  reminderDensity: 'low' | 'medium' | 'high'
  reminderTopics: string[]
  fcmToken?: string
  /** תצוגת יומן: חודשים עבריים (נשמר ב-Firestore לעומת localStorage בלבד) */
  journalHebrewCalendar?: boolean
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

/** גרסה אישית לתבנית עמוד — `users/{uid}/pageTemplatePreferences/{templateId}` */
export interface PageTemplatePreference {
  templateId: string
  customBodyHtml: string
  updatedAt?: Timestamp
}

/** טיוטת פוסט — לא מוצגת ביומן עד פרסום */
export interface PageDraft {
  id?: string
  text: string
  /** מפתח יום מקומי YYYY-MM-DD */
  dayKey: string
  templateId?: string
  scheduleId?: string
  imageUrl?: string
  status: 'draft'
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

/** מתי לשלוח התראה לפי לוח זמנים של תבנית */
export type TemplateScheduleNotificationCadence = 'every_day' | 'work_days' | 'weekdays_only'

/** חלון זמן ליצירת טיוטה יומית מתבנית */
export interface TemplateSchedule {
  id?: string
  templateId: string
  /** כותרת לתצוגה בהתראה */
  templateTitle?: string
  startDate: Timestamp
  endDate: Timestamp
  createdAt?: Timestamp
  /** שעת תזכורת (HH:mm), ברירת מחדל משעת התזכורת בהגדרות */
  notificationTime?: string
  /** כל יום / רק ימי עבודה מהפרופיל / א׳–ה׳ */
  notificationCadence?: TemplateScheduleNotificationCadence
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
