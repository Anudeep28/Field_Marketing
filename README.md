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

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on specific platform
npx expo start --ios
npx expo start --android
npx expo start --web
```

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
└── constants/              # Theme, colors, spacing
```

## Data Retention

By default, records are retained for **6 months**. This is configurable in Settings (1–24 months). Old records are automatically cleaned up on app launch. Use the Export feature to create permanent backups.
