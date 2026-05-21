import { useState, useEffect } from 'react'
import { ipc } from '@renderer/lib/ipc'
import { useCalendarStore } from '@renderer/store/useCalendarStore'
import { useCalendarSync } from '@renderer/hooks/useCalendarSync'
import { useNotifications } from '@renderer/hooks/useNotifications'
import { NavBar } from '@renderer/components/NavBar'
import { AuthScreen } from '@renderer/components/AuthScreen'
import { ClockWidget } from '@renderer/components/widgets/ClockWidget'
import { WeatherWidget } from '@renderer/components/widgets/WeatherWidget'
import { NextEventWidget } from '@renderer/components/widgets/NextEventWidget'
import { WeekView } from '@renderer/views/WeekView'
import { MonthView } from '@renderer/views/MonthView'
import { DayView } from '@renderer/views/DayView'
import { EventModal } from '@renderer/components/modals/EventModal'
import { NotificationModal } from '@renderer/components/modals/NotificationModal'
import { ConfirmDeleteModal } from '@renderer/components/modals/ConfirmDeleteModal'

type AuthState = 'checking' | 'unauthenticated' | 'authenticated'

export function App() {
  const [authState, setAuthState] = useState<AuthState>('checking')
  const activeView = useCalendarStore((s) => s.activeView)

  useEffect(() => {
    ipc()
      .getAuthStatus()
      .then(({ authenticated }) => {
        setAuthState(authenticated ? 'authenticated' : 'unauthenticated')
      })
      .catch(() => setAuthState('unauthenticated'))
  }, [])

  useCalendarSync()
  useNotifications()

  if (authState === 'checking') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ color: 'var(--color-text-faint)', fontSize: 14 }}>Loading…</div>
      </div>
    )
  }

  if (authState === 'unauthenticated') {
    return <AuthScreen onAuthenticated={() => setAuthState('authenticated')} />
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left sidebar */}
      <div
        style={{
          width: 'var(--sidebar-width)',
          flexShrink: 0,
          borderRight: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <ClockWidget />
        <WeatherWidget />
        <NextEventWidget />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <NavBar />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {activeView === 'week' && <WeekView />}
          {activeView === 'month' && <MonthView />}
          {activeView === 'day' && <DayView />}
        </div>
      </div>

      {/* Modals */}
      <EventModal />
      <ConfirmDeleteModal />
      <NotificationModal />
    </div>
  )
}
