# FieldPulse - Marketing Visit Tracker

A cross-platform marketing team daily visits tracking app built with **Expo SDK 52**, **TypeScript**, and **Expo Router**. Works on **iOS**, **Android**, and **Web**.

## Features

- **Daily Visit Logging** — Plan, check-in, and check-out of client visits with GPS verification
- **GPS-Verified Check-in/out** — Automatic location capture with address reverse geocoding
- **Client/Lead Management** — Full CRM with lead status tracking (New → Won/Lost)
- **Calendar View** — Visual calendar with visit dots, daily agenda view
- **Dashboard with KPIs** — Today's visits, weekly/monthly stats, completion rates
- **Visit History** — Search, filter by status/purpose, sort by date
- **6+ Month Data Retention** — Configurable retention period (1–24 months)
- **CSV/JSON Export** — Export visits by period (today, week, month, all) for reporting
- **Offline-First** — All data stored locally via AsyncStorage
- **Team Roles** — Admin, Manager, Field Agent role-based access
- **Photo Evidence** — Capture photos during visits (expo-image-picker ready)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 52 + React Native 0.76 |
| Navigation | Expo Router v4 (file-based) |
| State | Zustand v5 |
| Storage | AsyncStorage (offline-first) |
| Location | expo-location |
| Language | TypeScript 5.3 |
| Styling | React Native StyleSheet |
| Icons | @expo/vector-icons (Ionicons) |
| Date Utils | date-fns v4 |

## Getting Started (Development)

```bash
npm install
npx expo start
npx expo start --web
```

---

## Docker Deployment (Production - Client Machine)

### Prerequisites

- **Docker** installed ([Install Docker](https://docs.docker.com/get-docker/))
- **Git** installed
- Docker set to **start on boot** (for 24/7 auto-restart)

### Step 1: Clone the repository on client machine

```bash
git clone https://github.com/Anudeep28/Field_Marketing.git
cd Field_Marketing
```

### Step 2: First-time deploy

**Linux/macOS:**
```bash
chmod +x docker-deploy.sh
./docker-deploy.sh start
```

**Windows:**
```bat
docker-deploy.bat start
```

This builds the app, starts the container, and enables **auto-restart** (runs 24/7, survives reboots).

### Step 3: Access the app

| Role | URL |
|------|-----|
| Admin | `http://localhost:3000` |
| Agents | `http://<CLIENT_MACHINE_IP>:3000` |

### Step 4: Update after new changes are pushed to GitHub

When you push code changes to GitHub, run **one command** on the client machine:

**Linux/macOS:**
```bash
./docker-deploy.sh update
```

**Windows:**
```bat
docker-deploy.bat update
```

This automatically: pulls latest code → rebuilds image → restarts container → cleans old images.

### Other commands

```bash
./docker-deploy.sh status    # Check running status, health, uptime
./docker-deploy.sh logs      # Tail live container logs
./docker-deploy.sh restart   # Restart container
./docker-deploy.sh stop      # Stop container
./docker-deploy.sh backup    # Export data file from container
```

### Default Login Credentials

**Admin:** `admin@fieldpulse.in` / `admin123`

**Field Agents (password: `agent123`):**
- `arjun@fieldpulse.in`
- `kavitha@fieldpulse.in`
- `rohit@fieldpulse.in`

### Data Persistence

All data is stored in a Docker volume (`fieldpulse-data`). Data survives container restarts, rebuilds, and image updates. Only removed if you explicitly delete the volume with `docker compose down -v`.

---

## Project Structure

```
Marketing_app/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout
│   ├── login.tsx           # Login/onboarding
│   ├── settings.tsx        # App settings
│   ├── export.tsx          # Data export
│   ├── (tabs)/             # Tab navigation
│   │   ├── index.tsx       # Dashboard
│   │   ├── visits.tsx      # Visit list
│   │   ├── calendar.tsx    # Calendar view
│   │   ├── clients.tsx     # Client list
│   │   └── profile.tsx     # User profile
│   ├── visit/
│   │   ├── new.tsx         # New visit form
│   │   └── [id].tsx        # Visit detail + check-in/out
│   └── client/
│       ├── new.tsx         # New client form
│       └── [id].tsx        # Client detail
├── components/ui/          # Reusable UI components
├── store/                  # Zustand state management
├── types/                  # TypeScript type definitions
├── utils/                  # Helper functions
├── constants/              # Theme, colors, spacing
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Production compose config
├── docker-deploy.sh        # Deploy script (Linux/macOS)
└── docker-deploy.bat       # Deploy script (Windows)
```

## Data Retention

By default, records are retained for **6 months**. This is configurable in Settings (1–24 months). Old records are automatically cleaned up on app launch. Use the Export feature to create permanent backups.
