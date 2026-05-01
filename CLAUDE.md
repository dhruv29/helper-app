# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start both frontend and backend together (recommended)
npm run dev

# Start individually
npm run client     # Vite frontend on https://localhost:5173 (HTTPS required for mic)
npm run server     # Express API on http://localhost:3000

# Build for production
npm run build
```

There are no tests in this project.

## Environment

Copy the keys from `.env` — required keys:
- `ANTHROPIC_API_KEY` — Claude (voice chat)
- `OPENAI_API_KEY` — Whisper transcription
- `PORT` — defaults to 3001 if unset (`.env` sets it to 3000, matching the Vite proxy target)

Optional TTS — auto-selected by priority: `TTS_PROVIDER` env var → ElevenLabs if key present → Fish Audio if key present → error. Falls back to browser `speechSynthesis` only if the frontend catches a `/api/speak` failure:
- `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID`
- `FISH_AUDIO_API_KEY` / `FISH_AUDIO_VOICE_ID`
- `TTS_PROVIDER=elevenlabs|fish` — force a specific provider

Clerk (required for auth — frontend only):
- `VITE_CLERK_PUBLISHABLE_KEY` — from clerk.com → your app → API Keys

Supabase (optional — app works with mock data if unset):
- `SUPABASE_URL` — project URL from Supabase dashboard → Project Settings → API
- `SUPABASE_SERVICE_KEY` — service_role secret key (bypasses RLS, server-only)

Frontend API base URL (optional):
- `VITE_API_URL` — overrides default `http://localhost:3001` in `src/lib/api.js`

To set up the database: run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor. Seed data (demo senior Vijay Kumar Gupta + caregiver Dhruv) is included in the migration.

## Service Setup

### Clerk (Authentication)

1. Go to [clerk.com](https://clerk.com) and create a free account
2. Create a new application — name it "Helper"
3. Choose **Email** as the sign-in option (disable social for now)
4. Go to **API Keys** in the left sidebar
5. Copy the **Publishable Key** (starts with `pk_test_…`)
6. Add to `.env`: `VITE_CLERK_PUBLISHABLE_KEY=pk_test_...`
7. Restart the dev server — the login screen will appear

Auth flow: **Login → (no profile) → Onboarding → App** / **(profile exists) → App**

### Supabase (Database)

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Go to **SQL Editor** and run the entire `supabase/migrations/001_initial_schema.sql`
3. Copy **Project URL** and **service_role** secret from **Project Settings → API**
4. Add to `.env` and restart the server

> **Never expose `SUPABASE_SERVICE_KEY` to the frontend.** It bypasses Row Level Security. It only lives in `server/db.js`.

## Architecture

This is a fullstack eldercare assistant. The frontend is a React SPA; the backend is an Express server that proxies to Anthropic, OpenAI, and TTS providers. Vite proxies `/api/*` to `localhost:3000` in dev (`vite.config.js`). In production (Vercel), `api/[...path].js` is the serverless entry point that re-exports the Express app.

The Vite dev server runs HTTPS via `@vitejs/plugin-basic-ssl` — required for the browser `MediaRecorder` API (microphone access). The Express CORS config (`origin: /localhost/`) only allows localhost origins.

### Demo account auto-seeding

`App.jsx` contains a `DEMO_PROFILES` map keyed by email. When `dhruv.mait@gmail.com` logs in with no localStorage profile, `AppShell` calls `api.setup()` with the demo data (skipping onboarding entirely) and goes straight to the senior view. Any other email goes through the blank onboarding wizard. A `setupCalledRef` guard prevents double-calling setup when the user object re-renders during auth.

### Data flow for a voice interaction

1. User presses mic → `VoiceConnect` records audio via `MediaRecorder`
2. Audio blob is base64-encoded and POSTed to `/api/transcribe` → OpenAI Whisper returns text
3. Transcript + conversation history sent to `/api/voice-chat` → streams Claude response via SSE
4. `server/claude.js` scans the user message for scam/emergency keywords before streaming; if detected, emits an `alert` SSE event first
5. The streamed text response is POSTed to `/api/speak` → returns MP3 audio (ElevenLabs or Fish Audio); falls back to browser TTS if no key
6. Completed conversation is saved to `localStorage` under `helper_history` (max 30 days)
7. When a conversation ends (`PATCH /api/conversations/:id/end`), `summarizeConversation` is called server-side to generate a one-sentence summary + mood field, stored in the `handoffs` table and surfaced in the caregiver dashboard

### Alert dual-source

Alerts in `CaregiverDashboard` come from two places that are merged in `App.jsx`'s `alerts` state:
- **DB** — `GET /api/alerts` fetched on dashboard mount (persisted across sessions)
- **SSE** — `alert` events emitted during a voice session flow: `server/claude.js` → `VoiceConnect` → `onAlert` prop → `addAlert` in `AppShell` → passed as `alerts` prop to `CaregiverDashboard`

`App.jsx` initializes `alerts` with two hardcoded demo alerts so the dashboard is never empty on first load.

### Views / pages

`App.jsx` owns three top-level views toggled by a `view` state and a shared `alerts` array that flows down as props:

| View | File | Purpose |
|------|------|---------|
| `senior` | `SeniorHome.jsx` | Elder-facing: Talk to Sarah (VoiceConnect), conversation history, upcoming meds/appointments |
| `caregiver` | `CaregiverDashboard.jsx` | Caregiver-facing: Overview, Health, Finance, Alerts tabs; warm cream palette |
| `setup` | `Setup.jsx` | Onboarding wizard on first login; also reachable from nav to edit senior profile + medications |

`Landing.jsx` is the unauthenticated marketing page. Auth state is managed by Clerk; `App.jsx` wraps everything in `<ClerkProvider>`. The SSO callback route (`/sso-callback`) is handled inline in `App.jsx` before the provider mounts.

### localStorage keys

Profile is stored per Clerk user: `helper_profile_{userId}` (shape: `{ seniorName, caregiverName, ..., seniorId, caregiverId, notifyVia }`). Conversation history is stored at `helper_history`. `seniorId` / `caregiverId` are written after the first successful `POST /api/setup` call and used for all subsequent API queries. `notifyVia` captures the notification preference from the onboarding wizard (`'dashboard'` by default).

### Key component: `VoiceConnect`

`src/components/VoiceConnect.jsx` is a `forwardRef` component exposing two imperative handles:
- `triggerVoice()` — starts mic recording
- `triggerMessage(text)` — sends a text message programmatically (used by quick-action pills)

State machine: `idle → listening → thinking → speaking → idle` (or `error`). In `compact` mode (used inside `SeniorHome`) it renders a minimal button + reply card; full mode renders the large button UI.

### Claude prompts

`server/claude.js` has two system prompts:
- `SYSTEM_SENIOR_TEMPLATE` — Sarah persona, warm companion for the elder; uses `{{CAREGIVER_NAME}}` placeholder replaced at runtime with the caregiver's name from the request
- `SYSTEM_CAREGIVER` — practical eldercare advisor for the family member

Mode is selected by the `mode` field in the `/api/voice-chat` request body (`'senior'` or `'caregiver'`). The model is `claude-haiku-4-5-20251001` with `max_tokens: 150` — intentionally small for low-latency voice.

### Styling

Tailwind with custom tokens in `tailwind.config.js`:
- `elder-sm/base/lg/xl/2xl` — large accessible font sizes
- `helper-navy/blue/green/red/amber` — brand colors
- `helper-gray-light/mid/gray-text` — neutral scale

`CaregiverDashboard` uses inline design tokens (`C` object at top of file) with warm cream palette (`#EDE8DF` / `#1C1917`). It loads real data from the Express API on mount and falls back to mock constants if Supabase is not configured.

### Backend data layer

`server/db.js` is the Supabase data-access module — all DB calls go through it. `src/lib/api.js` is the frontend wrapper around the Express REST endpoints.

`syncMedications` does a full delete + re-insert for a senior's medications on each setup save. `upsertCaregiver` uses `clerk_user_id` as the conflict key when available, ensuring one DB record per Clerk account.

REST routes in `server/index.js`:
- `GET /api/alerts` · `POST /api/alerts` · `PATCH /api/alerts/:id/resolve`
- `GET /api/medications` · `PATCH /api/medications/:id/taken`
- `GET|PUT /api/wellness`
- `GET /api/handoffs/latest` · `POST /api/handoffs`
- `POST /api/conversations` · `PATCH /api/conversations/:id/end` · `GET|POST /api/conversations/:id/messages`
- `POST /api/setup` — upserts senior + caregiver records, syncs medications, returns `{ seniorId, caregiverId }`

All routes default to the demo senior UUID `00000000-0000-0000-0000-000000000001` when `senior_id` is not passed.
