import { format, startOfWeek, endOfWeek } from 'date-fns'
import { useCalendarStore, type CalendarView } from '@renderer/store/useCalendarStore'
import { useSettingsStore } from '@renderer/store/useSettingsStore'
import { ClockWidget } from '@renderer/components/widgets/ClockWidget'
import { NextEventWidget } from '@renderer/components/widgets/NextEventWidget'
import { WeatherCompact } from '@renderer/components/widgets/WeatherWidget'

const VIEWS: { key: CalendarView; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'day', label: 'Day' },
]

function getDateRangeLabel(view: CalendarView, date: Date): string {
  if (view === 'week') {
    const start = startOfWeek(date, { weekStartsOn: 0 })
    const end = endOfWeek(date, { weekStartsOn: 0 })
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`
    }
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
  }
  if (view === 'month') return format(date, 'MMMM yyyy')
  return format(date, 'EEEE, MMMM d, yyyy')
}

const divider = (
  <div style={{ width: 1, height: 32, backgroundColor: 'var(--color-border)', flexShrink: 0 }} />
)

export function NavBar() {
  const { activeView, selectedDate, setActiveView, navigateForward, navigateBackward, goToToday } =
    useCalendarStore()
  const openDrawer = useSettingsStore((s) => s.openDrawer)

  return (
    <div
      style={{
        height: 'var(--navbar-height)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 16px',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {/* Hamburger */}
      <button
        onClick={openDrawer}
        style={{
          width: 44,
          height: 44,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          borderRadius: 'var(--radius-md)',
          flexShrink: 0,
        }}
      >
        <div style={{ width: 20, height: 2, backgroundColor: 'var(--color-text-muted)', borderRadius: 1 }} />
        <div style={{ width: 20, height: 2, backgroundColor: 'var(--color-text-muted)', borderRadius: 1 }} />
        <div style={{ width: 20, height: 2, backgroundColor: 'var(--color-text-muted)', borderRadius: 1 }} />
      </button>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 2 }}>
        <button
          onClick={navigateBackward}
          style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}
        >
          ‹
        </button>
        <button
          onClick={navigateForward}
          style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}
        >
          ›
        </button>
      </div>

      <button
        onClick={goToToday}
        style={{
          padding: '10px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--color-text)',
          flexShrink: 0,
          minHeight: 44,
        }}
      >
        Today
      </button>

      {/* Date range — takes remaining space */}
      <div style={{ flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--color-text)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {getDateRangeLabel(activeView, selectedDate)}
      </div>

      {/* Weather */}
      <WeatherCompact />

      {divider}

      {/* Next event */}
      <NextEventWidget />

      {divider}

      {/* Clock */}
      <ClockWidget />

      {divider}

      {/* View switcher */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'var(--color-surface-elevated)',
          borderRadius: 'var(--radius-md)',
          padding: 3,
          gap: 2,
          flexShrink: 0,
        }}
      >
        {VIEWS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveView(key)}
            style={{
              padding: '10px 20px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: activeView === key ? 600 : 400,
              color: activeView === key ? '#fff' : 'var(--color-text-muted)',
              backgroundColor: activeView === key ? 'var(--color-primary)' : 'transparent',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
