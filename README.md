# StagePick

A voting platform for live contests: browse events, vote free or paid, watch the
leaderboard update, and manage a contest from the organiser dashboard.

The project is split into two independent folders:

```
Stage-Pick/
├─ frontend/            React + Vite app
│  ├─ src/              UI: voter app, organiser dashboard, landing, auth store
│  ├─ public/           Static assets
│  ├─ scripts/          jsdom flow checks + Babel transpile helper
│  ├─ index.html
│  ├─ vite.config.js
│  ├─ eslint.config.js
│  ├─ package.json
│  └─ package-lock.json
├─ backend/             Node HTTP user API — no npm dependencies
│  ├─ server.js
│  └─ package.json
├─ package.json         Root scripts that delegate to each folder
└─ README.md
```

Each folder owns its own dependencies and `node_modules/`. `frontend/dist/`,
`frontend/.verify/` and `backend/users.json` are git-ignored; the backend
recreates `users.json` on first run.

## Requirements

- Node.js **20.19+** (Vite 8 requires `^20.19.0 || >=22.12.0`).
  Tested with Node **26.13.0** LTS — see `.nvmrc`.
- npm

## Install

From the repository root:

```bash
npm run install:all
```

This installs the frontend toolchain and the backend package. You can also run
`npm install` inside `frontend/` and `backend/` separately.

## Run

Start the two parts in separate terminals:

```bash
npm run server     # backend  → http://localhost:3001
npm run dev        # frontend → http://localhost:5173
```

Root scripts are thin wrappers around the folder scripts, so these are
equivalent:

| Root command | Runs |
| --- | --- |
| `npm run dev` | `npm --prefix frontend run dev` |
| `npm run build` | `npm --prefix frontend run build` |
| `npm run preview` | `npm --prefix frontend run preview` |
| `npm run lint` | `npm --prefix frontend run lint` |
| `npm run verify` | `npm --prefix frontend run verify` |
| `npm run server` | `npm --prefix backend start` |

### Frontend routes

| URL | Screen |
| --- | --- |
| `/?view=home` | Voter home (browse, search, vote) |
| `/?view=voter` | Legacy voter dashboard |
| `/?view=voter&mode=organizer` | Organiser dashboard |
| `/?view=voter&mode=organizer&wizard=1` | Organiser dashboard with the create-event wizard open |
| `/?view=oauth` | Sign-up / log-in page |

### Backend API

The API uses only Node's standard library, so it has no packages to install. It
listens on `http://localhost:3001` (override with `PORT`).

| Method | Path | Body | Result |
| --- | --- | --- | --- |
| `GET` | `/health` | — | `{ status: "ok", uptime }` |
| `GET` | `/api/users` | — | `{ users: [...] }` |
| `POST` | `/api/users` | `{ fullName, email, authProvider? }` | `{ user }` (201) |

Users are stored in `backend/users.json` (override the directory with
`DATA_DIR`). `CORS_ORIGIN` takes a comma-separated list of browser origins;
it defaults to `*` for local work.

## Deploying the backend (Render)

The API has no npm dependencies, so Render runs it straight from the repo.

1. Push the branch to GitHub.
2. Render dashboard → **New → Blueprint** → pick the repo → **Apply**.
   `render.yaml` creates the `stagepick-api` web service with
   `rootDir: backend`, start command `npm start`, health check `/health`, and
   CORS already allowing `https://stagepick.vercel.app`.
3. Copy the service URL (`https://stagepick-api.onrender.com`) and smoke-test it:

   ```bash
   curl https://stagepick-api.onrender.com/health
   curl -X POST https://stagepick-api.onrender.com/api/users \
     -H "Content-Type: application/json" \
     -d '{"fullName":"Ada Obi","email":"ada@example.com","authProvider":"google"}'
   ```

Prefer the dashboard? **New → Web Service**, connect the repo, then set Root
Directory `backend`, Build Command `npm install`, Start Command `npm start`,
and Health Check Path `/health`.

> The backend has no build step. A hand-created Node service starts with
> Render's default `yarn install; yarn build`, which fails with
> `error Command "build" not found` — overriding the build command as above
> (or deploying through the Blueprint) is what fixes it.

### Environment variables

| Key | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Set automatically by Render — don't set it yourself. |
| `DATA_DIR` | `backend/` | Folder holding `users.json`. |
| `CORS_ORIGIN` | `*` | Comma-separated browser origins allowed to call the API. |
| `NODE_VERSION` | `22` | Pinned in `render.yaml`. |

### Persistence

Render's **free** plan has no disks and restarts instances regularly, so
`users.json` is emptied on every deploy. For real data, upgrade the service to
**Starter** and uncomment `DATA_DIR` + the `disk:` block in `render.yaml`
(mount path `/var/data`) before applying — that keeps the file across deploys.

### Frontend wiring

The frontend does not call the API yet (accounts live in memory). When you wire
it up, point it at the service with `VITE_API_URL`, e.g.
`VITE_API_URL=https://stagepick-api.onrender.com`, and add the frontend origin
to `CORS_ORIGIN`.

## Demo sign-in

Email/password sign-in works in the frontend:

- **Email:** `alex@example.com`
- **Password:** `stagepick123`

You can also create an account from the vote sheet or `/?view=oauth`; new
accounts are kept in memory for the session only. Accounts do not survive a full
page reload because there is no auth database yet.

## Google sign-in

The "Continue with Google" button on `/?view=oauth` uses Google Identity
Services (the ID-token flow), so it needs only a public client ID — no client
secret and no backend round trip.

- Client ID: `660620187732-nmt5jr5uocj77fq5181j3knk360hnqon.apps.googleusercontent.com`
  (default in `frontend/src/googleAuth.js`, override with
  `VITE_GOOGLE_CLIENT_ID` — see `frontend/.env.example`).
- Google renders its own button; the popup returns a signed ID token, the
  profile is read from it, and the visitor is signed in. First-time visitors get
  an account created for that email (Google accounts have no password).

### Authorised origins

The origin the app is served from must be listed on the OAuth client, otherwise
the popup closes with `origin_mismatch`:

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) →
   **APIs & Services → Credentials**.
2. Open the **Web application** OAuth 2.0 client for the ID above.
3. Under **Authorised JavaScript origins**, add:
   - `https://stagepick.vercel.app`
   - `http://localhost:5173`
4. Save. No redirect URI is needed for this flow. Changes can take a few
   minutes to propagate.

### Vercel

The client ID ships in the bundle, so the current deployment works as-is. To
switch Google Cloud projects, add `VITE_GOOGLE_CLIENT_ID` in **Settings →
Environment Variables** and redeploy.

## Checks

```bash
npm run verify     # transpile the voter app and run the jsdom flow suite
npm run lint       # ESLint over frontend sources
npm run build      # production build in frontend/dist
```

The verification suite exercises 22 flows: browsing, search, link-only events,
free/paid voting, sign-in/resume, the organiser dashboard, the profile page,
sign-out, and credential validation.
