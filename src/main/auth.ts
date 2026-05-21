import { BrowserWindow } from 'electron'
import { google } from 'googleapis'
import * as http from 'http'
import * as url from 'url'
import { saveTokens, loadTokens, clearTokens } from './store'

function makeOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env')
  }
  return new google.auth.OAuth2(clientId, clientSecret)
}

export async function startOAuthFlow(): Promise<boolean> {
  return new Promise((resolve) => {
    const server = http.createServer()

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number }
      const redirectUri = `http://127.0.0.1:${addr.port}`
      const oauth2Client = makeOAuth2Client()

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/calendar'],
        redirect_uri: redirectUri,
      })

      const authWindow = new BrowserWindow({
        width: 900,
        height: 700,
        title: 'Connect Google Calendar',
        webPreferences: { nodeIntegration: false, contextIsolation: true },
      })
      authWindow.loadURL(authUrl)

      let handled = false

      server.on('request', async (req, res) => {
        if (handled) return
        const parsed = url.parse(req.url ?? '', true)
        const code = parsed.query.code as string | undefined

        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(
          '<html><body style="font-family:sans-serif;text-align:center;padding:60px">' +
            '<h2>Connected! You can close this window.</h2></body></html>',
        )
        server.close()

        if (!code) {
          authWindow.destroy()
          resolve(false)
          return
        }

        handled = true
        try {
          const { tokens } = await oauth2Client.getToken({ code, redirect_uri: redirectUri })
          saveTokens(tokens as Record<string, unknown>)
          authWindow.destroy()
          resolve(true)
        } catch {
          authWindow.destroy()
          resolve(false)
        }
      })

      authWindow.on('closed', () => {
        server.close()
        if (!handled) resolve(false)
      })
    })
  })
}

export async function getAuthenticatedClient() {
  const tokens = loadTokens()
  if (!tokens) throw new Error('Not authenticated')

  const oauth2Client = makeOAuth2Client()
  oauth2Client.setCredentials(tokens)

  if (tokens.expiry_date && (tokens.expiry_date as number) < Date.now() + 5 * 60 * 1000) {
    const { credentials } = await oauth2Client.refreshAccessToken()
    saveTokens(credentials as Record<string, unknown>)
    oauth2Client.setCredentials(credentials)
  }

  return oauth2Client
}

export function isAuthenticated(): boolean {
  return loadTokens() !== null
}

export function getAuthEmail(): string | undefined {
  const tokens = loadTokens()
  if (!tokens) return undefined
  const idToken = tokens.id_token as string | undefined
  if (!idToken) return undefined
  try {
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString())
    return payload.email
  } catch {
    return undefined
  }
}

export function signOut(): void {
  clearTokens()
}
