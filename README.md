# Pi Calendar

A fullscreen touchscreen calendar app for Raspberry Pi. Syncs with Google Calendar, shows a live clock and weather, and fires configurable reminders.

![Default view: week view with current day highlighted, sidebar with clock/weather/next event]

---

## Features

- **Week view** (default) with current day highlighted and a live time-of-day indicator
- **Agenda view**: a large-type list of the next 7 days (swipe or use the arrows to move by a week)
- Month and day views, swipe left/right to navigate. Multi-day and overnight events span every day they cover; busy month cells show "+N more", which opens that day
- Google Calendar sync — create, edit, and delete events that sync back to Google. New events can go on any calendar you have write access to; read-only calendars (e.g. holidays) can't be edited but still support local alerts. Events you have declined are hidden.
- **Sidebar widgets**: live clock, current weather (OpenWeatherMap), next event today with countdown
- Per-event notifications: configurable minutes-before alerts, optional chime sound
  - Alerts missed by up to 5 minutes (e.g. after the Pi wakes from sleep) still fire; older ones are dropped. Alerts are skipped for events that already started, all-day events, and events you declined.
- Fullscreen kiosk mode on Pi, normal window in dev

---

## Display settings

Open the menu (☰) and scroll to the bottom of the drawer. Settings are stored locally on the device.

| Setting | Default | Notes |
|---|---|---|
| Screensaver after | 5 min | Off, 2, 5, 10 or 30 minutes of no touch |
| Night dimming | 60% | Off, 30, 60 or 90% black overlay |
| Night window | 22:00 – 06:00 | May wrap past midnight |

Dimming is a software overlay, so it works on any display without hardware backlight access.

### Screensaver and photos

After the idle delay the app shows a full-screen ambient screen: a large clock, date, weather and your next event, drifting a few pixels each minute to avoid burn-in. Tap anywhere to return. Reminders still appear on top of it.

To show photos behind the clock, put `.jpg`, `.jpeg`, `.png` or `.webp` files in the photos folder. They are resized in the app, shown one at a time, and rotate every minute. Files over 30 MB are skipped.

- Recommended: set `PHOTO_DIR=/path/to/photos` in your `.env` (restart the app after changing it)
- Default if unset: a `photos` folder inside the app's Electron user-data directory (under `~/.config/` on Linux; the exact name depends on how the app was built)

With no photos the screensaver is a plain black screen with the clock.

---

## Sync behavior

- Events are fetched for the previous month through ~3 months ahead, plus whatever date range you are currently viewing, so browsing far from today still shows events.
- Calendar list and events are paginated, and every Google and weather request has a timeout (15s / 10s).
- If one calendar fails to sync, its last good events are kept and a "Sync issue" notice appears in the top bar; the same notice appears if no sync has succeeded in 5 minutes.
- Incremental sync (`syncToken`) is not used: Google does not allow it together with `timeMin`/`timeMax`, which the windowed fetch relies on. Each sync refetches the window.

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
