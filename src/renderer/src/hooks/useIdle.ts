import { useCallback, useEffect, useRef, useState } from 'react'

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel'] as const
const CHECK_MS = 5_000

// timeoutMin of 0 disables idle detection. While idle, input is ignored by
// the activity tracking and only an explicit wake() ends it, so the touch that
// dismisses the screensaver is not also delivered to the UI underneath.
export function useIdle(timeoutMin: number): { idle: boolean; wake: () => void } {
  const [idle, setIdle] = useState(false)
  const lastActivity = useRef(Date.now())

  const wake = useCallback(() => {
    lastActivity.current = Date.now()
    setIdle(false)
  }, [])

  useEffect(() => {
    if (timeoutMin <= 0) {
      setIdle(false)
      return
    }
    const mark = () => {
      lastActivity.current = Date.now()
    }
    for (const ev of ACTIVITY_EVENTS) window.addEventListener(ev, mark, { passive: true })
    const timer = setInterval(() => {
      if (Date.now() - lastActivity.current >= timeoutMin * 60_000) setIdle(true)
    }, CHECK_MS)
    return () => {
      for (const ev of ACTIVITY_EVENTS) window.removeEventListener(ev, mark)
      clearInterval(timer)
    }
  }, [timeoutMin])

  return { idle, wake }
}
