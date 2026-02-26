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
  questionId?: string
  energyLevel?: number
}

export interface Set {
  id: string
  title: string
  description: string
  emoji: string
  questions: string[]
  createdAt: Timestamp
}

export interface ActiveSet {
  setId: string
  currentQuestionIndex: number
  startedAt: Timestamp
}
