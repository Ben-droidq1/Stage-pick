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
| `GET` | `/api/users` | — | `{ users: [...] }` |
| `POST` | `/api/users` | `{ fullName, email, authProvider? }` | `{ user }` (201) |

Users are stored in `backend/users.json`.

## Demo sign-in

Email/password sign-in works in the frontend:

- **Email:** `alex@example.com`
- **Password:** `stagepick123`

You can also create an account from the vote sheet or `/?view=oauth`; new
accounts are kept in memory for the session only. Accounts do not survive a full
page reload because there is no auth database yet.

## Checks

```bash
npm run verify     # transpile the voter app and run the jsdom flow suite
npm run lint       # ESLint over frontend sources
npm run build      # production build in frontend/dist
```

The verification suite exercises 22 flows: browsing, search, link-only events,
free/paid voting, sign-in/resume, the organiser dashboard, the profile page,
sign-out, and credential validation.
