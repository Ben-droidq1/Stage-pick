# StagePick

A voting platform for live contests: browse events, vote free or paid, watch the
leaderboard update, and manage a contest from the organiser dashboard.

The whole app is self-contained in this folder:

```
Stage-Pick/
├─ src/                 React frontend (voter app, organiser dashboard, landing)
├─ public/              Static assets (favicon)
├─ backend/             Node user API — no npm dependencies
│  ├─ server.js
│  └─ package.json
├─ scripts/             jsdom flow checks and Babel transpile helper
├─ index.html
├─ package.json         Frontend + tooling dependencies
├─ package-lock.json
└─ vite.config.js
```

`node_modules/` is created inside this folder by `npm install`. `dist/` (build
output), `.verify/` (test output) and `backend/users.json` (runtime data) are
git-ignored.

## Requirements

- Node.js 18 or newer
- npm

## Frontend

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build and preview:

```bash
npm run build      # writes dist/
npm run preview    # http://localhost:4173
```

Useful routes:

| URL | Screen |
| --- | --- |
| `/?view=home` | Voter home (browse, search, vote) |
| `/?view=voter` | Legacy voter dashboard |
| `/?view=voter&mode=organizer` | Organiser dashboard |
| `/?view=voter&mode=organizer&wizard=1` | Organiser dashboard with the create-event wizard open |
| `/?view=oauth` | Sign-up / log-in page |

## Backend

The API lives in `backend/` and uses only Node's standard library, so it needs
no separate `npm install`.

```bash
# from the project root
npm run server

# or from inside the backend folder
cd backend
npm start
```

It listens on `http://localhost:3001` (override with `PORT`).

| Method | Path | Body | Result |
| --- | --- | --- | --- |
| `GET` | `/api/users` | — | `{ users: [...] }` |
| `POST` | `/api/users` | `{ fullName, email, authProvider? }` | `{ user }` (201) |

Users are stored in `backend/users.json`, which is created automatically on the
first run.

## Demo sign-in

Email/password sign-in works in the frontend:

- **Email:** `alex@example.com`
- **Password:** `stagepick123`

You can also create an account from the vote sheet or `/?view=oauth`; new
accounts are added to the in-memory store for the session. Accounts are not
persisted across a full page reload (there is no auth database yet).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build |
| `npm run server` | Start the backend API |
| `npm run lint` | Run ESLint |
| `npm run verify` | Transpile the voter app and run the jsdom flow checks |

The verification suite exercises 22 flows: browsing, search, link-only events,
free/paid voting, sign-in/resume, the organiser dashboard, the profile page,
sign-out, and credential validation.
