# Pi Calendar

A fullscreen touchscreen calendar app for Raspberry Pi. Syncs with Google Calendar, shows a live clock and weather, and fires configurable reminders.

![Default view: week view with current day highlighted, sidebar with clock/weather/next event]

---

## Features

- **Week view** (default) with current day highlighted and a live time-of-day indicator
- Month and day views, swipe left/right to navigate
- Google Calendar sync — create, edit, and delete events that sync back to Google
- **Sidebar widgets**: live clock, current weather (OpenWeatherMap), next event today with countdown
- Per-event notifications: configurable minutes-before alerts, optional chime sound
- Fullscreen kiosk mode on Pi, normal window in dev

---

## Requirements

| Dependency | Version |
|---|---|
| Node.js | 18 or later |
| Raspberry Pi OS | 64-bit Desktop recommended |
| Google account | for Calendar API |
| OpenWeatherMap account | free tier |

---

## Install on Raspberry Pi

Run this on your Pi (connected to the internet):

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/danlafeir/calendar/main/install.sh)
```

The script will:
1. Install Node.js 20 LTS if needed
2. Install Electron's system library dependencies via `apt`
3. Clone this repo and `npm install`
4. Build the app for ARM64 (~10 min on a Pi 4)
5. Prompt you for credentials (Google + OpenWeatherMap)
6. Set up a systemd user service so the app starts on boot
7. Optionally start the app immediately

---

## Google Calendar credentials

Before first launch you need a Google OAuth **Desktop App** client.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a project
2. **Enable the Google Calendar API**: APIs & Services → Enable APIs → search *Google Calendar API*
3. **Create credentials**: APIs & Services → Credentials → Create Credentials → **OAuth client ID**
   - Application type: **Desktop app**
4. **Configure the consent screen**: APIs & Services → OAuth consent screen
   - User type: External
   - Add your Gmail as a **test user**
   - Add scope: `https://www.googleapis.com/auth/calendar`
5. Copy the **Client ID** and **Client Secret** into your `.env`

---

## OpenWeatherMap API key

1. Sign up at [openweathermap.org](https://openweathermap.org/api) — the free tier is enough
2. After signing up, go to **API keys** in your account dashboard and copy your default key (or generate a new one)
3. Note: new API keys can take up to 2 hours to activate after sign-up
4. Set your location coordinates in `.env` (decimal degrees — positive = North/East, negative = South/West)

**Finding your coordinates:**
- Search your city on [Google Maps](https://maps.google.com), right-click your location, and the first line of the context menu shows `lat, lon`
- Or use [latlong.net](https://www.latlong.net)

The weather widget displays in the top navigation bar showing the current temperature and condition (e.g. `☀️ 72°` / `clear sky`). Data is cached for 10 minutes. If the API key is missing or invalid, the widget is hidden rather than showing an error.

---

## Configuration

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

```dotenv
# Google OAuth — Desktop App client
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# OpenWeatherMap free-tier key
OPENWEATHER_API_KEY=xxxxx

# Your location for weather (decimal degrees)
# Example: San Francisco
WEATHER_LAT=37.7749
WEATHER_LON=-122.4194
```

---

## Run in development (Mac/Linux)

```bash
npm install
npm run dev
```

Electron opens in a normal (non-kiosk) window. The first thing you'll see is the **Connect Google Calendar** screen — click it and a browser window opens the Google OAuth consent flow. After you approve, the window closes and your calendar loads automatically. Tokens are saved locally and refreshed silently going forward.

---

## Notification sound

Drop any MP3 file at `resources/sounds/chime.mp3`. If the file is missing, notifications still show the modal but play no sound.

---

## Build for Raspberry Pi (cross-compile from Mac)

```bash
npm run build:linux:arm64
```

Output is at `dist/linux-arm64-unpacked/`. Copy it to the Pi:

```bash
rsync -avz dist/linux-arm64-unpacked/ pi@raspberrypi.local:/home/pi/calendar/
```

Then on the Pi, launch with the `--no-sandbox` flag (required on Raspberry Pi):

```bash
/home/pi/calendar/pi-calendar --no-sandbox
```

---

## Pi autostart

The install script sets this up automatically. To do it manually:

```bash
# Copy and edit the service file
cp resources/autostart/pi-calendar.service ~/.config/systemd/user/
nano ~/.config/systemd/user/pi-calendar.service  # update paths + credentials

systemctl --user daemon-reload
systemctl --user enable pi-calendar
systemctl --user start pi-calendar
```

Check logs:

```bash
journalctl --user -u pi-calendar -f
```

---

## Update

```bash
cd ~/pi-calendar
git pull
npm run build:pi
systemctl --user restart pi-calendar
```

---

## Uninstall

```bash
systemctl --user disable --now pi-calendar
rm -rf ~/pi-calendar
rm ~/.config/systemd/user/pi-calendar.service
systemctl --user daemon-reload
```

---

## Project structure

```
src/
├── types/ipc.ts              — shared types + IPC channel constants
├── main/                     — Electron main process (Node.js)
│   ├── auth.ts               — Google OAuth2 loopback flow + token refresh
│   ├── calendar.ts           — Google Calendar CRUD via googleapis
│   ├── weather.ts            — OpenWeatherMap fetch, 10-min cache
│   ├── notifications.ts      — 30 s scheduler → IPC push to renderer
│   ├── store.ts              — electron-store + OS-level token encryption
│   └── ipc.ts                — ipcMain handlers + background sync
├── preload/index.ts          — contextBridge API surface
└── renderer/src/
    ├── App.tsx               — auth gate, sidebar, view switcher
    ├── views/                — WeekView (default), MonthView, DayView
    ├── components/
    │   ├── CalendarGrid/     — WeekGrid, MonthGrid, DayGrid, EventBlock, TimeIndicator
    │   ├── widgets/          — ClockWidget, WeatherWidget, NextEventWidget
    │   └── modals/           — EventModal, NotificationModal, ConfirmDeleteModal
    ├── store/                — Zustand: calendar, weather, UI state
    └── hooks/                — calendar sync, notifications, swipe gestures
```

---

## Tech stack

| | |
|---|---|
| Framework | React 18 + Electron |
| Build tool | electron-vite |
| State | Zustand |
| Date math | date-fns |
| Google API | googleapis (main process only) |
| Storage | electron-store + safeStorage |
| Sound | Howler.js |
| Weather | OpenWeatherMap REST API |
