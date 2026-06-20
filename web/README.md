# Badbaado — Web (React + Vite)

Frontend for the Badbaado family & couple **emergency app**. Talks to `badbaado-backend`.

## Astaamaha (Features)
- **Auth** — login / register, JWT with **auto refresh** (axios interceptor).
- **Live map** — MapLibre GL (OpenStreetMap), real-time member markers via **Socket.IO**.
- **SOS** — press-and-hold button creates an alert + sends your GPS location.
- **Cod/Video recording** — `MediaRecorder` records audio/video and uploads as emergency evidence.
- **CRUD** — circles (create/join/leave), members, safe zones, alerts, check-ins.
- **3 luqadood (i18n)** — Soomaali / Carabi (RTL) / Ingiriis, switchable live; syncs to profile.
- **Dark / Light mode** — toggle, persisted (CSS variables).

## Run
```bash
cp .env.example .env      # point VITE_API_URL to the backend
npm install
npm run dev               # http://localhost:5173  (start badbaado-backend first)
```

## Structure
```
src/
  lib/        api.js (axios + refresh), socket.js
  i18n/       translations.js (so/ar/en) + provider (RTL handling)
  store/      auth.jsx, theme.jsx (dark/light)
  components/ Layout, SosButton, Recorder, MapView, ThemeToggle, LanguageSwitcher ...
  pages/      Login, Register, Dashboard, Circles, CircleDetail, Alerts, Profile
```
> The build warns the MapLibre chunk is >500 kB — harmless. For production, code-split the map with a dynamic import().
