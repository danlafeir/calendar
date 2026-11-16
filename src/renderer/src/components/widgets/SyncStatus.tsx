import { useEffect, useState } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'
import { useCalendarStore } from '@renderer/store/useCalendarStore'

const STALE_AFTER_MS = 5 * 60 * 1000

export function SyncStatus() {
  const { lastSyncedAt, failing } = useCalendarStore((s) => s.sync)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])

  const stale = lastSyncedAt !== null && now - lastSyncedAt > STALE_AFTER_MS
  if (!failing && !stale) return null

  const updated =
    lastSyncedAt === null
      ? 'not yet synced'
      : `updated ${formatDistanceToNowStrict(lastSyncedAt)} ago`

  return (
    <div
      title="Calendar data may be out of date"
      style={{ fontSize: 12, color: '#d29922', flexShrink: 0, whiteSpace: 'nowrap' }}
    >
      ⚠ Sync issue · {updated}
    </div>
  )
}
