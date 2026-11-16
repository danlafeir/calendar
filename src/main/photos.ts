import { app, nativeImage } from 'electron'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const MAX_FILE_BYTES = 30 * 1024 * 1024
const TARGET_WIDTH = 1280

let index = 0

export function photoDir(): string {
  return process.env.PHOTO_DIR || join(app.getPath('userData'), 'photos')
}

// Returns the next photo in the folder as a downscaled JPEG data URL, or null
// if there are none. Resizing in main keeps multi-megabyte originals off the
// renderer and IPC. The renderer never supplies a path, only asks for "next".
export async function getNextPhoto(): Promise<string | null> {
  let names: string[]
  try {
    names = (await readdir(photoDir())).filter((n) => EXTENSIONS.has(extOf(n))).sort()
  } catch {
    return null
  }
  if (names.length === 0) return null

  for (let tries = 0; tries < names.length; tries++) {
    const name = names[index % names.length]
    index = (index + 1) % names.length
    const file = join(photoDir(), name)
    try {
      if ((await stat(file)).size > MAX_FILE_BYTES) continue
      const img = nativeImage.createFromPath(file)
      if (img.isEmpty()) continue
      const resized = img.getSize().width > TARGET_WIDTH ? img.resize({ width: TARGET_WIDTH }) : img
      return `data:image/jpeg;base64,${resized.toJPEG(80).toString('base64')}`
    } catch {
      continue
    }
  }
  return null
}

function extOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i < 0 ? '' : name.slice(i).toLowerCase()
}
