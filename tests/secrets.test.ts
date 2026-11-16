import { describe, expect, it } from 'vitest'
import { secretStatus } from '../src/main/secretBackend'
import { imageDimensions } from '../src/main/imageDimensions'

describe('secretStatus', () => {
  it('trusts the OS store on macOS and Windows', () => {
    expect(secretStatus('darwin', true, null).protected).toBe(true)
    expect(secretStatus('win32', true, null).protected).toBe(true)
  })

  it('accepts real Linux keyrings', () => {
    expect(secretStatus('linux', true, 'gnome_libsecret').protected).toBe(true)
    expect(secretStatus('linux', true, 'kwallet6').protected).toBe(true)
  })

  it('does not count the Linux hardcoded-key fallback as protection', () => {
    expect(secretStatus('linux', true, 'basic_text').protected).toBe(false)
    expect(secretStatus('linux', true, 'unknown').protected).toBe(false)
    expect(secretStatus('linux', true, null).protected).toBe(false)
  })

  it('is unprotected when encryption is unavailable', () => {
    expect(secretStatus('darwin', false, null).protected).toBe(false)
  })
})

function png(w: number, h: number): Buffer {
  const b = Buffer.alloc(33)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b)
  b.write('IHDR', 12, 'ascii')
  b.writeUInt32BE(w, 16)
  b.writeUInt32BE(h, 20)
  return b
}

describe('imageDimensions', () => {
  it('reads PNG', () => {
    expect(imageDimensions(png(4000, 3000))).toEqual({ width: 4000, height: 3000 })
  })

  it('reads JPEG, skipping earlier segments', () => {
    const app1 = Buffer.concat([Buffer.from([0xff, 0xe1, 0x00, 0x0a]), Buffer.alloc(8)])
    const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0x0b, 0xb8, 0x0f, 0xa0, 0x03])
    const jpg = Buffer.concat([Buffer.from([0xff, 0xd8]), app1, sof, Buffer.alloc(20)])
    expect(imageDimensions(jpg)).toEqual({ width: 4000, height: 3000 })
  })

  it('reads WebP VP8X, VP8L and VP8', () => {
    const head = (kind: string) => {
      const b = Buffer.alloc(40)
      b.write('RIFF', 0, 'ascii')
      b.write('WEBP', 8, 'ascii')
      b.write(kind, 12, 'ascii')
      return b
    }
    const x = head('VP8X')
    x.writeUIntLE(3999, 24, 3)
    x.writeUIntLE(2999, 27, 3)
    expect(imageDimensions(x)).toEqual({ width: 4000, height: 3000 })

    const l = head('VP8L')
    l.writeUInt32LE((3999 & 0x3fff) | (2999 << 14), 21)
    expect(imageDimensions(l)).toEqual({ width: 4000, height: 3000 })

    const lossy = head('VP8 ')
    lossy.writeUInt16LE(4000, 26)
    lossy.writeUInt16LE(3000, 28)
    expect(imageDimensions(lossy)).toEqual({ width: 4000, height: 3000 })
  })

  it('returns null for unknown or truncated data', () => {
    expect(imageDimensions(Buffer.from('not an image at all, just text'))).toBeNull()
    expect(imageDimensions(Buffer.from([0xff, 0xd8, 0xff]))).toBeNull()
    expect(imageDimensions(Buffer.alloc(0))).toBeNull()
  })
})
