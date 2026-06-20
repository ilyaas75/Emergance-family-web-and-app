# Badbaado — Backend API

Family & couple **emergency app** API. Foundation for the React web app and Flutter mobile app.

## Tech
Node.js · Express · MongoDB (Mongoose) · Socket.IO · JWT (access + rotating refresh) · bcrypt · Multer

## Astaamaha (Features)
- **Auth adag**: register/login (phone + password), JWT access + **rotating refresh tokens**, optional **phone OTP**.
- **Authorization (RBAC)**: system roles (`admin`/`member`) + **per-circle roles** (circle admin vs member) + resource-scoped guards.
- **CRUD buuxa**: users, circles + members, safe zones, alerts, check-ins.
- **SOS + cod/video**: trigger alert, respond, resolve, and **upload audio/video evidence** (Multer).
- **Live location**: REST update + **real-time broadcast** over Socket.IO to the circle.
- **Geofence**: safe zones (2dsphere).
- **3 luqadood (i18n)**: Somali / Arabic / English — via `?lang=`, `x-lang` header, or `Accept-Language`.
- **Security**: helmet, CORS allowlist, rate limiting, mongo-sanitize, hpp, input validation, bcrypt(12), soft-delete.

## Run
```bash
cp .env.example .env      # edit secrets
npm install
npm run dev               # needs a running MongoDB (MONGO_URI)
```

## Main endpoints (base `/api/v1`)
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` `/auth/login` | phone + password |
| POST | `/auth/refresh` `/auth/logout` | token rotation |
| POST | `/auth/otp/request` `/auth/otp/verify` | phone OTP (dev returns code) |
| GET/PUT/DELETE | `/users/me` `/users/me/password` | profile + medical info |
| POST/GET | `/circles` `/circles/mine` `/circles/join` | |
| GET/PUT/DELETE | `/circles/:id` (+ `/members/:userId`) | per-circle RBAC |
| GET/POST | `/circles/:id/locations` | live location |
| GET/POST | `/circles/:id/alerts` (+ `/:alertId/respond`,`/resolve`,`/media`) | SOS + audio/video |
| GET/POST | `/circles/:id/checkins` (+ `/:id/respond`) | "Ma nabad baa?" |
| CRUD | `/circles/:id/safezones` | geofence |

## Real-time (Socket.IO)
Connect with `auth: { token: <accessToken> }`, then `emit('circle:join', circleId)`.
Server emits: `location:update`, `alert:new`, `alert:update`, `checkin:new`, `checkin:update`.

## Production notes
- Store media in S3/GCS with signed URLs (local disk is dev-only).
- Put refresh token in an HttpOnly+Secure cookie.
- Add an SMS gateway for real OTP delivery.
