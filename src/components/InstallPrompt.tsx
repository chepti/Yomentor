import { useInstallPrompt } from '@/hooks/useInstallPrompt'

export function InstallPrompt() {
  const { showPrompt, install, dismiss } = useInstallPrompt()

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 max-w-[430px] mx-auto bg-card rounded-card shadow-soft p-4 z-40">
      <p className="font-bold mb-2">הוספה למסך הבית</p>
      <p className="text-sm text-muted mb-4">
        הוסיפי את יומנטור למסך הבית לגישה מהירה
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={install}
          className="flex-1 bg-primary text-white py-2 rounded-[50px]"
        >
          הוספה
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="px-4 py-2 text-muted"
        >
          אולי אחר כך
        </button>
      </div>
    </div>
  )
}
