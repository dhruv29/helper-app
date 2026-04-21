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
- `PORT` — defaults to 3001 if unset (`.env` sets it to 3000)

Optional TTS (falls back to browser `speechSynthesis` if unset):
- `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID`
- `FISH_AUDIO_API_KEY` / `FISH_AUDIO_VOICE_ID`
- `TTS_PROVIDER=elevenlabs|fish` — override auto-selection

Clerk (required for auth — frontend only):
- `VITE_CLERK_PUBLISHABLE_KEY` — from clerk.com → your app → API Keys

Supabase (optional — app works with mock data if unset):
- `SUPABASE_URL` — project URL from Supabase dashboard → Project Settings → API
- `SUPABASE_SERVICE_KEY` — service_role secret key (bypasses RLS, server-only)

Frontend API base URL (optional):
- `VITE_API_URL` — overrides default `http://localhost:3001` in `src/lib/api.js`

To set up the database: run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor. Seed data (demo senior Margaret + caregiver Sarah) is included in the migration.

## Service Setup

### Clerk (Authentication)

1. Go to [clerk.com](https://clerk.com) and create a free account
2. Create a new application — name it "Helper"
3. Choose **Email** as the sign-in option (disable social for now)
4. Go to **API Keys** in the left sidebar
5. Copy the **Publishable Key** (starts with `pk_test_…`)
6. Add to `.env`:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```
7. Restart the dev server — the login screen will appear

Auth flow: **Login → (no profile) → Onboarding → App** / **(profile exists) → App**

### Supabase (Database)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New project** — choose a region close to your users
3. Set a strong database password (save it somewhere)
4. Wait ~2 minutes for the project to provision
5. Go to **SQL Editor** in the left sidebar
6. Paste the entire contents of `supabase/migrations/001_initial_schema.sql` and click **Run**
   - This creates all 8 tables + seeds demo data (Margaret + Sarah)
7. Go to **Project Settings → API**
8. Copy **Project URL** and **service_role** secret key
9. Add to `.env`:
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJ...
   ```
10. Restart the server — the dashboard will load real data instead of mocks

> **Never expose `SUPABASE_SERVICE_KEY` to the frontend.** It bypasses Row Level Security. It only lives in the Express server (`server/db.js`).

## Architecture

This is a fullstack eldercare assistant. The frontend is a React SPA; the backend is an Express server that proxies to Anthropic, OpenAI, and TTS providers. Vite proxies `/api/*` to `localhost:3000` in dev. In production (Vercel), `api/[...path].js` is the serverless entry point that re-exports the Express app.

### Data flow for a voice interaction

1. User presses mic button → `VoiceConnect` records audio via `MediaRecorder`
2. Audio blob is base64-encoded and POSTed to `/api/transcribe` → OpenAI Whisper returns text
3. Transcript + conversation history is sent to `/api/voice-chat` → streams Claude response via SSE
4. `server/claude.js` scans the user message for scam/emergency keywords before streaming; if detected, emits an `alert` SSE event first
5. The streamed text response is POSTed to `/api/speak` → returns MP3 audio (ElevenLabs or Fish Audio); falls back to browser TTS if no key
6. Completed conversation is saved to `localStorage` under `helper_history` (max 30 days)

### Views / pages

`App.jsx` owns three top-level views toggled by a `view` state and a shared `alerts` array that flows down as props:

| View | File | Purpose |
|------|------|---------|
| `senior` | `SeniorHome.jsx` | Elder-facing: Talk to Sarah (VoiceConnect), conversation history, upcoming meds/appointments |
| `caregiver` | `CaregiverDashboard.jsx` | Caregiver-facing: Overview, Health, Finance, Alerts tabs; warm cream palette |
| `setup` | `Setup.jsx` | Onboarding wizard on first login; also reachable from nav to edit senior profile + medications |

Alerts originate either from `server/claude.js` keyword detection (emitted via SSE → `VoiceConnect` → `onAlert` prop) or from the SOS button in `SeniorHome`.

`Landing.jsx` is the unauthenticated marketing page shown to signed-out users. Auth state is managed by Clerk; `App.jsx` wraps everything in `<ClerkProvider>` and renders `<Landing>` for `<SignedOut>` and `<AppShell>` for `<SignedIn>`. The SSO callback route (`/sso-callback`) is handled inline in `App.jsx` before the provider mounts.

### localStorage keys

Profile is stored per Clerk user: `helper_profile_{userId}` (shape: `{ seniorName, caregiverName, ..., seniorId, caregiverId }`). Conversation history is stored at `helper_history`. `seniorId` / `caregiverId` are written after the first successful `POST /api/setup` call and used for all subsequent API queries.

### Animations

`framer-motion` (`motion`, `AnimatePresence`) is used for page transitions and micro-interactions across `Login.jsx`, `Landing.jsx`, and `Setup.jsx`.

### Key component: `VoiceConnect`

`src/components/VoiceConnect.jsx` is a `forwardRef` component exposing two imperative handles:
- `triggerVoice()` — starts mic recording
- `triggerMessage(text)` — sends a text message programmatically (used by quick-action pills)

It runs a state machine: `idle → listening → thinking → speaking → idle` (or `error`). In `compact` mode (used inside `SeniorHome`) it renders a minimal button + reply card; in full mode it renders the large button UI.

### Claude prompts

`server/claude.js` has two system prompts:
- `SYSTEM_SENIOR` — Sarah persona, warm companion for the elder; short responses, no special characters
- `SYSTEM_CAREGIVER` — practical eldercare advisor for the family member

Mode is selected by the `mode` field in the `/api/voice-chat` request body (`'senior'` or `'caregiver'`).

### Styling

Tailwind with custom tokens in `tailwind.config.js`:
- `elder-sm/base/lg/xl/2xl` — large accessible font sizes
- `helper-navy/blue/green/red/amber` — brand colors
- `helper-gray-light/mid/gray-text` — neutral scale

`CaregiverDashboard` uses inline design tokens (`C` object at top of file) with warm cream palette (`#EDE8DF` / `#1C1917`). It loads real data from the Express API on mount (alerts, medications, wellness, handoff) and falls back to the mock constants if Supabase is not configured.

### Backend data layer

`server/db.js` is the Supabase data-access module — all DB calls go through it. `src/lib/api.js` is the frontend wrapper around the Express REST endpoints.

REST routes added to `server/index.js`:
- `GET /api/alerts` · `POST /api/alerts` · `PATCH /api/alerts/:id/resolve`
- `GET /api/medications` · `PATCH /api/medications/:id/taken`
- `GET|PUT /api/wellness`
- `GET /api/handoffs/latest` · `POST /api/handoffs`
- `POST /api/conversations` · `PATCH /api/conversations/:id/end` · `GET|POST /api/conversations/:id/messages`

All routes default to the demo senior UUID `00000000-0000-0000-0000-000000000001` when `senior_id` is not passed.
