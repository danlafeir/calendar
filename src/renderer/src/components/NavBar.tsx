import { format, startOfWeek, endOfWeek } from 'date-fns'
import { useCalendarStore, type CalendarView } from '@renderer/store/useCalendarStore'

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

export function NavBar() {
  const { activeView, selectedDate, setActiveView, navigateForward, navigateBackward, goToToday } =
    useCalendarStore()

  return (
    <div
      style={{
        height: 'var(--navbar-height)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {/* Navigation arrows */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={navigateBackward}
          style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}
        >
          ‹
        </button>
        <button
          onClick={navigateForward}
          style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}
        >
          ›
        </button>
      </div>

      {/* Today button */}
      <button
        onClick={goToToday}
        style={{
          padding: '8px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--color-text)',
        }}
      >
        Today
      </button>

      {/* Date range label */}
      <div style={{ flex: 1, fontSize: 16, fontWeight: 500, color: 'var(--color-text)' }}>
        {getDateRangeLabel(activeView, selectedDate)}
      </div>

      {/* View switcher */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'var(--color-surface-elevated)',
          borderRadius: 'var(--radius-md)',
          padding: 3,
          gap: 2,
        }}
      >
        {VIEWS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveView(key)}
            style={{
              padding: '8px 18px',
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
