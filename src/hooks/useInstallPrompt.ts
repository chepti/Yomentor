import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const SAVED_KEY = 'yomentor_has_saved'

export function setHasSavedOnce() {
  try {
    localStorage.setItem(SAVED_KEY, '1')
  } catch {}
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      try {
        if (localStorage.getItem(SAVED_KEY)) {
          setDeferredPrompt(e as BeforeInstallPromptEvent)
          setShowPrompt(true)
        }
      } catch {
        setDeferredPrompt(e as BeforeInstallPromptEvent)
        setShowPrompt(true)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShowPrompt(false)
    return outcome
  }

  const dismiss = () => {
    setShowPrompt(false)
  }

  return { showPrompt, install, dismiss }
}
