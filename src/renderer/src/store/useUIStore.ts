import { create } from 'zustand'
import type { CalendarEvent, NotificationPayload } from '@renderer/types'

interface UIState {
  isEventModalOpen: boolean
  editingEvent: CalendarEvent | null
  newEventDate: Date | null
  isDeleteConfirmOpen: boolean
  deletingEvent: CalendarEvent | null
  notificationQueue: NotificationPayload[]

  openNewEvent: (date: Date) => void
  openEditEvent: (event: CalendarEvent) => void
  closeEventModal: () => void
  openDeleteConfirm: (event: CalendarEvent) => void
  closeDeleteConfirm: () => void
  pushNotification: (payload: NotificationPayload) => void
  dismissNotification: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  isEventModalOpen: false,
  editingEvent: null,
  newEventDate: null,
  isDeleteConfirmOpen: false,
  deletingEvent: null,
  notificationQueue: [],

  openNewEvent: (date) => set({ isEventModalOpen: true, editingEvent: null, newEventDate: date }),
  openEditEvent: (event) => set({ isEventModalOpen: true, editingEvent: event, newEventDate: null }),
  closeEventModal: () => set({ isEventModalOpen: false, editingEvent: null, newEventDate: null }),

  openDeleteConfirm: (event) => set({ isDeleteConfirmOpen: true, deletingEvent: event }),
  closeDeleteConfirm: () => set({ isDeleteConfirmOpen: false, deletingEvent: null }),

  pushNotification: (payload) =>
    set({ notificationQueue: [...get().notificationQueue, payload] }),
  dismissNotification: () =>
    set({ notificationQueue: get().notificationQueue.slice(1) }),
}))
