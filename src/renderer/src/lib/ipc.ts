import type { ElectronAPI } from '@renderer/types'

export function ipc(): ElectronAPI {
  return window.electronAPI
}
