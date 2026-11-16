import { useState, useEffect } from 'react'
import { ipc } from '@renderer/lib/ipc'
import { useCalendarStore } from '@renderer/store/useCalendarStore'
import { useCalendarSync, useVisibleRangeSync } from '@renderer/hooks/useCalendarSync'
import { useNotifications } from '@renderer/hooks/useNotifications'
import { PersonChips } from '@renderer/components/PersonChips'
import { NavBar } from '@renderer/components/NavBar'
import { AuthScreen } from '@renderer/components/AuthScreen'
import { AmbientScreen } from '@renderer/components/AmbientScreen'
import { useIdle } from '@renderer/hooks/useIdle'
import { useSettingsStore } from '@renderer/store/useSettingsStore'
import { NightDim } from '@renderer/components/NightDim'
import { Drawer } from '@renderer/components/Drawer'
import { WeekView } from '@renderer/views/WeekView'
import { MonthView } from '@renderer/views/MonthView'
import { DayView } from '@renderer/views/DayView'
import { HomeView } from '@renderer/views/HomeView'
import { AgendaView } from '@renderer/views/AgendaView'
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

  useCalendarSync(authState === 'authenticated')
  useVisibleRangeSync(authState === 'authenticated')
  useNotifications()
  const idleTimeoutMin = useSettingsStore((s) => s.prefs.idleTimeoutMin)
  const { idle, wake } = useIdle(authState === 'authenticated' ? idleTimeoutMin : 0)

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <NavBar />
      <PersonChips />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeView === 'week' && <WeekView />}
        {activeView === 'month' && <MonthView />}
        {activeView === 'day' && <DayView />}
        {activeView === 'agenda' && <AgendaView />}
        {activeView === 'home' && <HomeView />}
      </div>

      <Drawer />
      <EventModal />
      <ConfirmDeleteModal />
      <NotificationModal />
      {idle && <AmbientScreen onWake={wake} />}
      <NightDim />
    </div>
  )
}
