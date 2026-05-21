import { create } from 'zustand'
import type { CalendarEvent, NotificationPayload } from '@renderer/types'

interface UIState {
  isEventModalOpen: boolean
  editingEvent: CalendarEvent | null
  newEventDate: Date | null
  isDeleteConfirmOpen: boolean
  deletingEventId: string | null
  notificationQueue: NotificationPayload[]

  openNewEvent: (date: Date) => void
  openEditEvent: (event: CalendarEvent) => void
  closeEventModal: () => void
  openDeleteConfirm: (eventId: string) => void
  closeDeleteConfirm: () => void
  pushNotification: (payload: NotificationPayload) => void
  dismissNotification: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  isEventModalOpen: false,
  editingEvent: null,
  newEventDate: null,
  isDeleteConfirmOpen: false,
  deletingEventId: null,
  notificationQueue: [],

  openNewEvent: (date) => set({ isEventModalOpen: true, editingEvent: null, newEventDate: date }),
  openEditEvent: (event) => set({ isEventModalOpen: true, editingEvent: event, newEventDate: null }),
  closeEventModal: () => set({ isEventModalOpen: false, editingEvent: null, newEventDate: null }),

  openDeleteConfirm: (eventId) => set({ isDeleteConfirmOpen: true, deletingEventId: eventId }),
  closeDeleteConfirm: () => set({ isDeleteConfirmOpen: false, deletingEventId: null }),

  pushNotification: (payload) =>
    set({ notificationQueue: [...get().notificationQueue, payload] }),
  dismissNotification: () =>
    set({ notificationQueue: get().notificationQueue.slice(1) }),
}))
