import { useEffect, useRef } from 'react'
import { useCalendarStore } from '@renderer/store/useCalendarStore'

const SWIPE_THRESHOLD = 60

export function useTouchGestures(elementRef: React.RefObject<HTMLElement>): void {
  const navigateForward = useCalendarStore((s) => s.navigateForward)
  const navigateBackward = useCalendarStore((s) => s.navigateBackward)
  const startX = useRef<number | null>(null)

  useEffect(() => {
    const el = elementRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (startX.current === null) return
      const delta = e.changedTouches[0].clientX - startX.current
      if (Math.abs(delta) > SWIPE_THRESHOLD) {
        if (delta < 0) navigateForward()
        else navigateBackward()
      }
      startX.current = null
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [elementRef, navigateForward, navigateBackward])
}
