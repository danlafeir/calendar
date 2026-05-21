import { useEffect } from 'react'
import { ipc } from '@renderer/lib/ipc'
import { useUIStore } from '@renderer/store/useUIStore'

export function useNotifications(): void {
  const pushNotification = useUIStore((s) => s.pushNotification)

  useEffect(() => {
    const unsub = ipc().onNotificationReminder(pushNotification)
    return unsub
  }, [pushNotification])
}
