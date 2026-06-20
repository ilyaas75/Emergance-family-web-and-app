# Badbaado 🛡️
**Family & couple emergency app** — full-stack project.
Nabadgelyada qoyska & lammaanaha: SOS hal-taabasho, raadraac live, cod/video, 3 luqadood, dark/light.

```
badbaado/
├── badbaado-backend/   # Node + Express + MongoDB + Socket.IO  (REST + realtime API)
├── badbaado-web/       # React + Vite  (web app: auth, live map, SOS, recorder, i18n, dark/light)
├── badbaado-mobile/    # Flutter  (iOS/Android: SOS, GPS, audio/video, live map, i18n, dark/light)
└── prototype/          # badbaado-prototype.html  (single-file clickable demo)
```

## Astaamaha (Features)
- **SOS** hal-taabasho + goobta GPS, **cod/video recording** (emergency evidence)
- **Raadraac live** (Socket.IO) + khariidad (MapLibre / OpenStreetMap)
- **CRUD** buuxa: users, circles + members, safe zones, alerts, check-ins
- **Amni adag**: JWT access + refresh rotation, bcrypt, RBAC, helmet, rate-limit, validation
- **3 luqadood (i18n)**: Soomaali / Carabi (RTL) / Ingiriis
- **Dark / Light mode**

## Orodsii (Quick start)
> Waxaad u baahan tahay **Node 18+** iyo **MongoDB** oo shaqaynaya.

**1. Backend**
```bash
cd badbaado-backend
cp .env.example .env        # wax ka beddel secrets-ka + MONGO_URI
npm install
npm run dev                 # http://localhost:5000/api/v1
```

**2. Web** (terminal kale)
```bash
cd badbaado-web
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api/v1
npm install
npm run dev                 # http://localhost:5173
```

**3. Prototype** — fur `prototype/badbaado-prototype.html` browser kasta (offline).

**3. Mobile (Flutter)**
```bash
cd badbaado-mobile
flutter create .          # generates android/ios folders (won't touch lib/ or pubspec.yaml)
flutter pub get
# merge permission snippets from android-snippets/ , then:
flutter run --dart-define=API_BASE=http://10.0.2.2:5000/api/v1 --dart-define=SOCKET_URL=http://10.0.2.2:5000
```

**4. Prototype** — fur `prototype/badbaado-prototype.html` browser kasta.

Tafaasiil dheeraad ah: eeg `badbaado-backend/README.md` iyo `badbaado-web/README.md`.
