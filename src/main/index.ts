import { app, BrowserWindow } from 'electron'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { createWindow } from './window'
import { registerIpcHandlers } from './ipc'
import { lockStorePermissions } from './store'

// Load .env for development
const envPath = join(process.cwd(), '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 0) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (key && !(key in process.env)) process.env[key] = value
  }
}

app.on('ready', async () => {
  await lockStorePermissions()
  const mainWindow = createWindow()
  // Register IPC handlers before the page loads so renderer invoke calls don't race
  registerIpcHandlers(mainWindow)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const mainWindow = createWindow()
    registerIpcHandlers(mainWindow)
  }
})
