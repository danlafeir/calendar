#!/usr/bin/env bash
# Pi Calendar installer
# Usage: bash <(curl -fsSL https://raw.githubusercontent.com/danlafeir/calendar/main/install.sh)
set -euo pipefail

# ── Colours ────────────────────────────────────────────────────────────────────
CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
header() { echo -e "\n${CYAN}━━━  $1  ━━━${NC}\n"; }
ok()     { echo -e "  ${GREEN}✓${NC}  $1"; }
warn()   { echo -e "  ${YELLOW}⚠${NC}  $1"; }
err()    { echo -e "  ${RED}✗${NC}  $1"; }
ask()    { echo -e "  ${CYAN}?${NC}  $1"; }

REPO_URL="https://github.com/danlafeir/calendar.git"
INSTALL_DIR="${HOME}/pi-calendar"
SERVICE_NAME="pi-calendar"
SERVICE_FILE="${HOME}/.config/systemd/user/${SERVICE_NAME}.service"

# ── Banner ──────────────────────────────────────────────────────────────────────
clear
echo -e "${CYAN}"
echo "  ╔═══════════════════════════════════╗"
echo "  ║       Pi Calendar Installer       ║"
echo "  ╚═══════════════════════════════════╝"
echo -e "${NC}"
echo "  This will install Pi Calendar on your Raspberry Pi."
echo "  Estimated time: 10–20 minutes (mostly downloading Electron)."
echo

# ── Pre-flight checks ───────────────────────────────────────────────────────────
header "Checking system"

# Architecture
ARCH=$(uname -m)
if [[ "$ARCH" == "aarch64" ]]; then
  ok "Architecture: ARM64 (Raspberry Pi OS 64-bit) ✓"
elif [[ "$ARCH" == "armv7l" ]]; then
  ok "Architecture: ARMv7 (Raspberry Pi OS 32-bit) ✓"
else
  warn "Architecture '$ARCH' is not a Raspberry Pi. Continuing anyway."
fi

# Root check
if [[ "$EUID" -eq 0 ]]; then
  err "Do not run this installer as root. Run as your normal Pi user (e.g. 'pi')."
  exit 1
fi
ok "Running as user: $(whoami)"

# Disk space – need ~2 GB
FREE_KB=$(df -k "${HOME}" | awk 'NR==2 {print $4}')
FREE_MB=$(( FREE_KB / 1024 ))
if [[ $FREE_MB -lt 1800 ]]; then
  err "Not enough free space (need ~2 GB, have ${FREE_MB} MB). Free up disk space and try again."
  exit 1
fi
ok "Free disk space: ${FREE_MB} MB"

# Internet connectivity
if ! curl -fsSL --max-time 5 https://github.com > /dev/null 2>&1; then
  err "Cannot reach github.com. Check your internet connection."
  exit 1
fi
ok "Internet connectivity: OK"

# ── Node.js ─────────────────────────────────────────────────────────────────────
header "Node.js"

NEED_NODE=true
if command -v node &>/dev/null; then
  NODE_MAJOR=$(node -e "console.log(parseInt(process.versions.node))" 2>/dev/null || echo "0")
  if [[ "$NODE_MAJOR" -ge 18 ]]; then
    ok "Node.js $(node -v) already installed"
    NEED_NODE=false
  else
    warn "Node.js $(node -v) is too old (need v18+). Upgrading…"
  fi
fi

if [[ "$NEED_NODE" == "true" ]]; then
  echo "  Installing Node.js 20 LTS via NodeSource…"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - 2>&1 | grep -E "(Running|Successfully)" || true
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs > /dev/null
  ok "Node.js $(node -v) installed"
fi

# ── System dependencies for Electron ───────────────────────────────────────────
header "System dependencies"
echo "  Installing Electron runtime libraries…"
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  git \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libasound2 \
  libdbus-1-3 \
  libx11-xcb1 > /dev/null
ok "System libraries installed"

# ── Clone / update repo ─────────────────────────────────────────────────────────
header "Source code"
if [[ -d "${INSTALL_DIR}/.git" ]]; then
  warn "Existing installation found at ${INSTALL_DIR}. Updating…"
  git -C "${INSTALL_DIR}" pull --ff-only
  ok "Updated to latest"
else
  echo "  Cloning repository…"
  git clone "${REPO_URL}" "${INSTALL_DIR}"
  ok "Cloned to ${INSTALL_DIR}"
fi

# ── npm install ─────────────────────────────────────────────────────────────────
header "Dependencies  (this downloads the Electron binary — may take a few minutes)"
cd "${INSTALL_DIR}"
npm install 2>&1 | tail -3
ok "Dependencies installed"

# ── Build ───────────────────────────────────────────────────────────────────────
header "Building app  (this takes 5–10 minutes on a Pi 4)"
npm run build:pi 2>&1 | grep -E "(✓|error|warn|built)" || true

# Locate the produced executable
APP_BIN=$(find "${INSTALL_DIR}/dist" -maxdepth 2 -name "pi-calendar" -type f 2>/dev/null | head -1)
if [[ -z "$APP_BIN" ]]; then
  err "Build failed: executable not found in dist/."
  echo "  Run 'npm run build:pi' manually inside ${INSTALL_DIR} for full error output."
  exit 1
fi
ok "Built: ${APP_BIN}"

# ── Configuration ───────────────────────────────────────────────────────────────
header "Configuration"

echo "  You'll need two things before continuing:"
echo
echo "  1. Google OAuth credentials"
echo "     • Go to https://console.cloud.google.com/apis/credentials"
echo "     • Create a project, enable 'Google Calendar API'"
echo "     • Create an OAuth client → Desktop App type"
echo
echo "  2. OpenWeatherMap API key (free)"
echo "     • Sign up at https://openweathermap.org/api"
echo

ask "Google Client ID:"
read -r GOOGLE_CLIENT_ID
ask "Google Client Secret:"
read -r -s GOOGLE_CLIENT_SECRET
echo

ask "OpenWeatherMap API key:"
read -r OPENWEATHER_API_KEY

echo
ask "Your location latitude  (e.g. 37.7749 for San Francisco):"
read -r WEATHER_LAT
ask "Your location longitude (e.g. -122.4194 for San Francisco):"
read -r WEATHER_LON

# Write .env (readable only by this user)
cat > "${INSTALL_DIR}/.env" <<ENVEOF
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY}
WEATHER_LAT=${WEATHER_LAT}
WEATHER_LON=${WEATHER_LON}
ENVEOF
chmod 600 "${INSTALL_DIR}/.env"
ok "Credentials saved to ${INSTALL_DIR}/.env  (mode 600)"

# ── Notification sound (optional) ───────────────────────────────────────────────
SOUND_SRC="${INSTALL_DIR}/resources/sounds"
if [[ ! -f "${SOUND_SRC}/chime.mp3" ]]; then
  echo
  warn "No notification sound found at resources/sounds/chime.mp3"
  echo "  Drop any MP3 file there and name it chime.mp3 to enable sounds."
fi

# ── Systemd autostart ───────────────────────────────────────────────────────────
header "Autostart"

# Enable lingering so the user service starts at boot without a login session
loginctl enable-linger "$(whoami)" 2>/dev/null || warn "Could not enable linger (may need to enable manually)"

mkdir -p "$(dirname "${SERVICE_FILE}")"
cat > "${SERVICE_FILE}" <<SVCEOF
[Unit]
Description=Pi Calendar
After=graphical-session.target
Wants=graphical-session.target

[Service]
Type=simple
ExecStart=${APP_BIN} --no-sandbox
WorkingDirectory=${INSTALL_DIR}
Restart=on-failure
RestartSec=5
Environment=DISPLAY=:0
EnvironmentFile=${INSTALL_DIR}/.env

[Install]
WantedBy=graphical-session.target
SVCEOF

systemctl --user daemon-reload
systemctl --user enable "${SERVICE_NAME}"
ok "Autostart enabled  →  ${SERVICE_FILE}"

# ── Done ────────────────────────────────────────────────────────────────────────
header "Installation complete! 🎉"
echo "  App location:  ${INSTALL_DIR}"
echo "  Executable:    ${APP_BIN}"
echo "  Credentials:   ${INSTALL_DIR}/.env"
echo "  Service:       ${SERVICE_FILE}"
echo
echo "  Useful commands:"
echo "    Start now:      systemctl --user start ${SERVICE_NAME}"
echo "    Stop:           systemctl --user stop ${SERVICE_NAME}"
echo "    View logs:      journalctl --user -u ${SERVICE_NAME} -f"
echo "    Reconfigure:    nano ${INSTALL_DIR}/.env"
echo "    Update app:     cd ${INSTALL_DIR} && git pull && npm run build:pi"
echo "    Uninstall:      systemctl --user disable --now ${SERVICE_NAME} && rm -rf ${INSTALL_DIR}"
echo

ask "Start the app now? [Y/n]"
read -r START_NOW
if [[ "${START_NOW}" != [nN]* ]]; then
  systemctl --user start "${SERVICE_NAME}"
  ok "Pi Calendar is running!"
  echo
  echo "  If the window doesn't appear, your display session may not be ready yet."
  echo "  Rebooting is the simplest way to confirm autostart works: sudo reboot"
fi

echo
