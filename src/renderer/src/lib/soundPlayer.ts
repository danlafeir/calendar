import { Howl } from 'howler'

let chime: Howl | null = null

function getChime(): Howl {
  if (!chime) {
    chime = new Howl({
      src: ['../sounds/chime.mp3'],
      volume: 0.7,
      onloaderror: () => {
        chime = null
      },
    })
  }
  return chime
}

export function playChime(): void {
  try {
    getChime().play()
  } catch {
    // ignore — sound is optional
  }
}
