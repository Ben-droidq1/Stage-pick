import { useEffect, useMemo, useRef, useState } from "react";
import {
  Menu,
  X,
  Search,
  ArrowLeft,
  Check,
  Plus,
  Minus,
  Share2,
  Bell,
  BellRing,
  Crown,
  Clock3,
  User,
  BarChart3,
  LogOut,
  Link2,
  AlertCircle,
  Trophy,
  Lock,
  Ticket,
  CalendarClock,
  ShieldCheck,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

/* ---------------------------------------------------------------------------
   StagePick — voter home screen.

   One file on purpose: discover → event → vote → payment all live here, with
   local state only. No backend, no router.
--------------------------------------------------------------------------- */

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const BOOT = Date.now();

const naira = (value) => `₦${Number(value).toLocaleString()}`;
const count = (value) => Number(value).toLocaleString();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Used when someone lands straight on the app (e.g. from the organiser view)
// without going through the landing sign-up form.
const GUEST_ACCOUNT = {
  name: "Alex Morgan",
  email: "alex@example.com",
  joined: "Member since March 2025",
};

const publicAccount = (account) => ({
  name: account.name,
  email: account.email,
  joined: account.joined,
});

function initials(name) {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function statusOf(event, now) {
  if (now >= event.endsAt) return "ended";
  if (now < event.startsAt) return "upcoming";
  if (event.endsAt - now <= 24 * HOUR) return "closing";
  return "live";
}

function timeLeft(ms) {
  if (ms <= 0) return "Ended";
  const d = Math.floor(ms / DAY);
  const h = Math.floor((ms % DAY) / HOUR);
  const m = Math.floor((ms % HOUR) / MIN);
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m left`;
  return `${Math.max(1, m)}m left`;
}

function startsIn(ms) {
  if (ms <= 0) return "Starting now";
  const d = Math.floor(ms / DAY);
  const h = Math.floor((ms % DAY) / HOUR);
  const m = Math.floor((ms % HOUR) / MIN);
  if (d > 0) return `Starts in ${d}d ${h}h`;
  if (h > 0) return `Starts in ${h}h ${m}m`;
  return `Starts in ${Math.max(1, m)}m`;
}

function dayLabel(at) {
  return new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

const cover = (from, to) => `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;

const trend = (end) => [0.72, 0.8, 0.87, 0.93, 1].map((f) => Math.round(end * f));

const person = (id, name, category, votes, delta) => ({
  id,
  name,
  category,
  votes,
  delta,
  trend: trend(votes),
});

/* Public events. Timestamps are relative to load so every section is populated. */
const SEED_EVENTS = [
  {
    id: "talent",
    slug: "campus-talent-night",
    code: "TALENT26",
    name: "Campus Talent Night 2026",
    description: "Five finalists, one crown. Every vote counts.",
    cover: cover("#dfe4ff", "#f6f2e6"),
    startsAt: BOOT - 2 * HOUR,
    endsAt: BOOT + 6 * HOUR,
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 1,
    paidVotingEnabled: true,
    paidVotePrice: 50,
    votingDisabled: false,
    contestants: [
      person("t1", "Amara Okafor", "Music", 842, 36),
      person("t2", "Tolu Adeyemi", "Dance", 913, 18),
      person("t3", "Ngozi Eze", "Spoken word", 654, 12),
      person("t4", "Ibrahim Sule", "Comedy", 1204, 64),
      person("t5", "Chidera Nwosu", "Music", 431, -8),
    ],
  },
  {
    id: "djs",
    slug: "battle-of-the-djs",
    code: "DJS26",
    name: "Battle of the DJs",
    description: "Four DJs, two decks, one winner. Paid votes only.",
    cover: cover("#dbe7ff", "#f6f1e6"),
    startsAt: BOOT - 1 * HOUR,
    endsAt: BOOT + 40 * HOUR,
    visibility: "public",
    freeVotingEnabled: false,
    freeVoteLimit: 0,
    paidVotingEnabled: true,
    paidVotePrice: 100,
    votingDisabled: false,
    contestants: [
      person("dj1", "DJ Kryptic", "Afrobeats", 2044, 88),
      person("dj2", "DJ Nova", "Amapiano", 1876, 42),
      person("dj3", "DJ Static", "Hip hop", 1320, 21),
      person("dj4", "DJ Blaze", "House", 908, -14),
    ],
  },
  {
    id: "food",
    slug: "best-campus-food-spot",
    code: "FOOD26",
    name: "Best Campus Food Spot",
    description: "Eight vendors, one title. Vote for the spot that never disappoints.",
    cover: cover("#ffe0c9", "#f8f3e6"),
    startsAt: BOOT - 30 * HOUR,
    endsAt: BOOT + 3 * HOUR,
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 1,
    paidVotingEnabled: true,
    paidVotePrice: 50,
    votingDisabled: false,
    contestants: [
      person("f1", "Mama Nkechi's Kitchen", "Local dishes", 986, 40),
      person("f2", "Grill Republic", "Barbecue", 902, 25),
      person("f3", "The Smoothie Bar", "Drinks", 744, 9),
      person("f4", "Shawarma Corner", "Fast food", 688, -6),
    ],
  },
  {
    id: "fresher",
    slug: "miss-fresher-2026",
    code: "FRESHER26",
    name: "Miss Fresher 2026",
    description: "The freshers' showcase. Two free votes each, then paid votes.",
    cover: cover("#ffdde6", "#f8f2e6"),
    startsAt: BOOT - 1 * HOUR,
    endsAt: BOOT + 18 * HOUR,
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 2,
    paidVotingEnabled: true,
    paidVotePrice: 50,
    votingDisabled: false,
    contestants: [
      person("mf1", "Bella Babalola", "Arts", 1250, 52),
      person("mf2", "Emanuella Adinye", "Sciences", 1124, 33),
      person("mf3", "Peace Chituga", "Law", 987, 17),
      person("mf4", "Zainab Bello", "Engineering", 1432, 60),
    ],
  },
  {
    id: "comedy",
    slug: "stand-up-comedy-slam",
    code: "COMEDY26",
    name: "Stand-up Comedy Slam",
    description: "Five comics, no warm-up. Voting is paused while the show resets.",
    cover: cover("#ffeec2", "#f8f3e6"),
    startsAt: BOOT - 3 * HOUR,
    endsAt: BOOT + 9 * HOUR,
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 1,
    paidVotingEnabled: true,
    paidVotePrice: 50,
    votingDisabled: true,
    contestants: [
      person("co1", "Kenny Blaq", "Stand-up", 1120, 31),
      person("co2", "Tee Ali", "Sketch", 1044, 22),
      person("co3", "MC Lively", "Stand-up", 988, 10),
    ],
  },
  {
    id: "hack",
    slug: "hackathon-demo-day",
    code: "HACK26",
    name: "Hackathon Demo Day",
    description: "Seven teams pitch what they built in 36 hours. Free voting for everyone.",
    cover: cover("#d7f2e6", "#f6f3e8"),
    startsAt: BOOT + 2 * DAY,
    endsAt: BOOT + 2 * DAY + 6 * HOUR,
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 3,
    paidVotingEnabled: false,
    paidVotePrice: 0,
    votingDisabled: false,
    contestants: [
      person("h1", "Team Bytewise", "Fintech", 322, 0),
      person("h2", "Team Loop", "Health", 287, 0),
      person("h3", "Team Kernel", "Developer tools", 265, 0),
      person("h4", "Team Lambda", "Education", 198, 0),
    ],
  },
  {
    id: "afro",
    slug: "afrobeats-dance-off",
    code: "AFRO26",
    name: "Afrobeats Dance-Off",
    description: "Four crews, one floor. Voting stays open until the last song ends.",
    cover: cover("#ffe3bd", "#f8f3e6"),
    startsAt: BOOT + 2 * DAY + 4 * HOUR,
    endsAt: BOOT + 2 * DAY + 9 * HOUR,
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 1,
    paidVotingEnabled: true,
    paidVotePrice: 75,
    votingDisabled: false,
    contestants: [
      person("a1", "Crew Inferno", "Afrobeats", 1490, 45),
      person("a2", "The MoveMakers", "Amapiano", 1388, 38),
      person("a3", "Street Kings", "Hip hop", 1102, 16),
    ],
  },
  {
    id: "gospel",
    slug: "gospel-music-awards",
    code: "GOSPEL26",
    name: "Gospel Music Awards",
    description: "Celebrating the voices that carry the campus choir.",
    cover: cover("#e7ddff", "#f7f2e8"),
    startsAt: BOOT + 7 * DAY,
    endsAt: BOOT + 7 * DAY + 5 * HOUR,
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 1,
    paidVotingEnabled: true,
    paidVotePrice: 150,
    votingDisabled: false,
    contestants: [
      person("g1", "Praise Adeyinka", "Contemporary", 1780, 0),
      person("g2", "The Covenant Choir", "Choral", 1655, 0),
      person("g3", "Samuel Iheanacho", "Traditional", 1210, 0),
    ],
  },
  {
    id: "debate",
    slug: "inter-faculty-debate",
    code: "DEBATE26",
    name: "Inter-Faculty Debate",
    description: "Six faculties, one motion. Free voting, no paywall — arguments only.",
    cover: cover("#d6eeee", "#f6f3e8"),
    startsAt: BOOT - 10 * HOUR,
    endsAt: BOOT - 3 * HOUR,
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 1,
    paidVotingEnabled: false,
    paidVotePrice: 0,
    votingDisabled: false,
    contestants: [
      person("d1", "Faculty of Law", "Law", 640, 14),
      person("d2", "Faculty of Arts", "Arts", 588, 9),
      person("d3", "Faculty of Sciences", "Sciences", 534, 3),
      person("d4", "Faculty of Engineering", "Engineering", 502, -4),
    ],
  },
  {
    id: "photo",
    slug: "photography-challenge",
    code: "PHOTO26",
    name: "Photography Challenge",
    description: "Nine photographers, one theme: 'Motion'. The shot that stopped you.",
    cover: cover("#f4dcea", "#f8f2e6"),
    startsAt: BOOT - 3 * DAY,
    endsAt: BOOT - 1 * DAY - 4 * HOUR,
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 1,
    paidVotingEnabled: true,
    paidVotePrice: 40,
    votingDisabled: false,
    contestants: [
      person("ph1", "Ada Chukwu", "Street", 733, 18),
      person("ph2", "Bode Ajayi", "Portrait", 702, 10),
      person("ph3", "Chiamaka Umeh", "Documentary", 655, 5),
    ],
  },
  {
    /* Link-only: never listed, only reachable from the link box or a direct link. */
    id: "pitch",
    slug: "startup-pitch-night",
    code: "PITCH26",
    name: "Startup Pitch Night",
    description: "Six founders, five minutes each. Invited guests only.",
    cover: cover("#e0e5f5", "#f6f2e6"),
    startsAt: BOOT - 1 * HOUR,
    endsAt: BOOT + 4 * HOUR,
    visibility: "private",
    freeVotingEnabled: true,
    freeVoteLimit: 2,
    paidVotingEnabled: true,
    paidVotePrice: 200,
    votingDisabled: false,
    contestants: [
      person("p1", "Kola Adebayo", "Fintech", 412, 12),
      person("p2", "Ifeoma Obi", "Health tech", 388, 7),
      person("p3", "Musa Danjuma", "Logistics", 340, 2),
    ],
  },
];

const STATUS = {
  live: { label: "Live" },
  closing: { label: "Closing soon" },
  upcoming: { label: "Upcoming" },
  ended: { label: "Ended" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "live", label: "Live now" },
  { key: "closing", label: "Closing soon" },
  { key: "upcoming", label: "Upcoming" },
  { key: "ended", label: "Ended" },
];

function findEvent(events, raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (!value) return null;
  const exact = events.find((event) =>
    [event.id, event.slug, event.code].some(
      (key) => String(key).toLowerCase() === value,
    ),
  );
  if (exact) return exact;
  return (
    events.find(
      (event) =>
        value.includes(`/e/${event.slug}`) ||
        value.includes(event.slug) ||
        value.includes(String(event.code).toLowerCase()),
    ) || null
  );
}

function totalVotes(event) {
  return event.contestants.reduce((sum, c) => sum + c.votes, 0);
}

function ranked(event) {
  return [...event.contestants].sort((a, b) => b.votes - a.votes);
}

const CSS = `
.sp{--paper:#f3f1e9;--panel:#fffdf7;--panel-2:#f7f4ea;
  --ink:#14131a;--ink-2:#2b2932;--ink-dim:#5e5b54;--mute:#8b867a;
  --line:#ddd9cc;--line-strong:#c9c4b4;
  --blue:#3b5bf5;--blue-dark:#2c49d8;--blue-soft:#e7ebff;
  --green:#1f7a4d;--green-soft:#d7f2e4;
  --orange:#f2682a;--yellow:#f5c445;--yellow-soft:#fdf2cf;
  --red:#c2412f;--red-soft:#fbe3dd;
  --text:var(--ink);--muted:var(--ink-dim);
  background:
    radial-gradient(900px 520px at -10% -14%, rgba(242,104,42,.14), transparent 62%),
    radial-gradient(760px 500px at 108% -10%, rgba(59,91,245,.10), transparent 64%),
    radial-gradient(900px 620px at 50% 112%, rgba(150,87,232,.08), transparent 70%),
    var(--paper);
  color:var(--ink);min-height:100vh;position:relative;
  font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased;font-size:15px;line-height:1.5;padding-bottom:32px;}
.sp *{box-sizing:border-box;}
.sp button,.sp input{font-family:inherit;}
.sp button{cursor:pointer;}
.sp :focus-visible{outline:2px solid var(--blue);outline-offset:3px;}
.sp .sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
  clip:rect(0,0,0,0);white-space:nowrap;border:0;}
.sp-wrap{width:100%;max-width:760px;margin:0 auto;padding:0 20px;}
.sp-num{font-family:'JetBrains Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums;}

/* top bar */
.sp-top{position:sticky;top:0;z-index:30;background:rgba(243,241,233,.9);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border-bottom:1px solid var(--line);}
.sp-top-in{display:flex;align-items:center;justify-content:space-between;min-height:64px;gap:12px;}
.sp-logo{font-size:21px;font-weight:800;letter-spacing:-.035em;line-height:1;color:var(--ink);}
.sp-logo-dot{color:var(--orange);}
.sp-top-right{display:flex;align-items:center;gap:6px;}
.sp-nav-link{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 14px;
  border:0;border-radius:999px;background:none;color:var(--ink);font-size:13.5px;font-weight:700;}
.sp-nav-link:hover{background:rgba(20,19,26,.06);}
.sp-icon{width:44px;height:44px;border-radius:999px;border:1px solid var(--line);
  background:var(--panel);color:var(--ink);display:inline-flex;align-items:center;justify-content:center;
  transition:background .15s,border-color .15s;}
.sp-icon:hover{background:var(--panel-2);border-color:var(--line-strong);}
.sp-menu{position:absolute;right:20px;top:66px;width:250px;z-index:40;background:var(--panel);
  border:1px solid var(--line);border-radius:16px;padding:8px;
  box-shadow:0 24px 60px rgba(20,19,26,.18);animation:sp-pop .16s ease-out;}
.sp-menu button{display:flex;align-items:center;gap:10px;width:100%;min-height:44px;padding:0 12px;
  background:none;border:0;border-radius:10px;color:var(--ink);font-size:14px;font-weight:600;text-align:left;}
.sp-menu button:hover{background:var(--panel-2);}
.sp-menu hr{border:0;border-top:1px solid var(--line);margin:6px 4px;}
.sp-menu-user{display:flex;align-items:center;gap:10px;min-width:0;padding:8px 12px 10px;
  border-bottom:1px solid var(--line);margin-bottom:6px;}
.sp-menu-user .sp-av{width:32px;height:32px;font-size:11px;}
.sp-menu-user>div{min-width:0;}
.sp-menu-user b{display:block;font-size:13px;font-weight:800;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis;}
.sp-menu-user small{display:block;font-size:11.5px;color:var(--ink-dim);white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis;}
@keyframes sp-pop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@media (max-width:560px){ .sp-nav-link{display:none;} }

/* header + link box */
.sp-head{padding:36px 0 0;}
.sp-eyebrow{display:inline-flex;align-items:center;gap:8px;margin-bottom:14px;
  font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-dim);}
.sp-eyebrow i{width:7px;height:7px;border-radius:50%;background:var(--orange);display:block;}
.sp-head h1{margin:0 0 10px;font-size:clamp(32px,7.2vw,52px);line-height:1.02;
  letter-spacing:-.045em;font-weight:800;}
.sp-sub{margin:0;color:var(--ink-dim);font-size:15px;max-width:52ch;line-height:1.55;}
.sp-linkbox{margin-top:24px;border:1px solid var(--line);border-radius:20px;
  background:var(--panel);padding:16px;}
.sp-label{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;
  color:var(--ink);margin-bottom:10px;}
.sp-label svg{color:var(--ink-dim);}
.sp-row{display:flex;gap:8px;}
.sp-input{flex:1;min-width:0;height:46px;border-radius:999px;border:1px solid var(--line);
  background:var(--paper);color:var(--ink);padding:0 18px;font-size:14px;}
.sp-input::placeholder{color:var(--mute);}
.sp-input:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,91,245,.14);}
.sp-err{display:flex;align-items:flex-start;gap:7px;margin:10px 2px 0;color:var(--red);
  font-size:12.5px;line-height:1.45;font-weight:600;}
.sp-err svg{flex-shrink:0;margin-top:1px;}

/* buttons */
.sp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  min-height:44px;padding:0 20px;border-radius:999px;border:1px solid var(--line-strong);
  background:var(--panel);color:var(--ink);font-size:14px;font-weight:700;
  white-space:nowrap;transition:background .15s,border-color .15s,transform .15s,box-shadow .15s,opacity .15s;}
.sp-btn:hover{background:var(--panel-2);border-color:var(--ink-dim);transform:translateY(-1px);}
.sp-btn:active{transform:translateY(0);}
.sp-btn.primary{background:var(--blue);border-color:var(--blue);color:#fff;
  box-shadow:0 6px 18px rgba(59,91,245,.22);}
.sp-btn.primary:hover{background:var(--blue-dark);border-color:var(--blue-dark);}
.sp-btn.primary:disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none;}
.sp-btn.block{width:100%;}
.sp-btn.ghost{border-color:transparent;background:none;padding:0 10px;color:var(--ink-dim);}
.sp-btn.ghost:hover{color:var(--ink);background:var(--panel-2);border-color:transparent;}
.sp-link{background:none;border:0;color:var(--ink);font-size:12.5px;font-weight:700;
  text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:4px;
  padding:8px 0;min-height:44px;}
.sp-link:hover{color:var(--blue);}

/* search + filters */
.sp-search{position:relative;margin-top:20px;}
.sp-search>svg{position:absolute;left:18px;top:50%;transform:translateY(-50%);color:var(--ink-dim);}
.sp-search input{width:100%;height:48px;border-radius:999px;border:1px solid var(--line);
  background:var(--panel);color:var(--ink);padding:0 48px;font-size:14px;}
.sp-search input::placeholder{color:var(--mute);}
.sp-search input:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,91,245,.14);}
.sp-search-clear{position:absolute;right:4px;top:50%;transform:translateY(-50%);
  width:40px;height:40px;border-radius:999px;border:0;background:none;color:var(--ink-dim);
  display:flex;align-items:center;justify-content:center;}
.sp-search-clear:hover{color:var(--ink);background:var(--panel-2);}
.sp-chips{display:flex;gap:8px;overflow-x:auto;padding:14px 0 2px;scrollbar-width:none;
  -webkit-mask-image:linear-gradient(to right,#000 92%,transparent 100%);
  mask-image:linear-gradient(to right,#000 92%,transparent 100%);}
.sp-chips::-webkit-scrollbar{display:none;}
.sp-chip{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;min-height:44px;
  padding:0 16px;border-radius:999px;border:1px solid var(--line);background:var(--panel);
  color:var(--ink-2);font-size:13px;font-weight:600;
  transition:background .15s,color .15s,border-color .15s;}
.sp-chip b{font-family:'JetBrains Mono',monospace;font-size:11.5px;font-weight:600;color:var(--mute);}
.sp-chip:hover{border-color:var(--line-strong);}
.sp-chip.on{background:var(--ink);border-color:var(--ink);color:#fff;}
.sp-chip.on b{color:rgba(255,255,255,.62);}

/* activity */
.sp-activity{margin-top:24px;}
.sp-h2{font-size:16px;font-weight:800;letter-spacing:-.02em;margin:0 0 10px;}
.sp-act-card{display:flex;align-items:center;justify-content:space-between;gap:12px;
  border:1px solid var(--line);border-radius:16px;background:var(--panel);padding:13px 15px;}
.sp-act-card + .sp-act-card{margin-top:8px;}
.sp-act-main{min-width:0;}
.sp-act-name{font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sp-act-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:3px;
  color:var(--ink-dim);font-size:12px;}
.sp-freeleft{color:var(--green);font-weight:700;}
.sp-act-side{display:flex;align-items:center;gap:10px;flex-shrink:0;}

/* sections + cards */
.sp-sec{margin-top:30px;}
.sp-sec-head{display:flex;align-items:baseline;gap:10px;margin-bottom:12px;flex-wrap:wrap;}
.sp-sec-head h2{margin:0;font-size:17px;font-weight:800;letter-spacing:-.025em;}
.sp-sec-count{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--ink-dim);}
.sp-sec-note{margin-left:auto;color:var(--ink-dim);font-size:12px;}
.sp-cards{display:flex;flex-direction:column;gap:14px;}
.sp-card{position:relative;border:1px solid var(--line);border-radius:20px;
  background:var(--panel);overflow:hidden;
  transition:border-color .18s,transform .18s,box-shadow .18s;}
.sp-card:hover{border-color:var(--line-strong);transform:translateY(-2px);
  box-shadow:0 12px 32px rgba(20,19,26,.09);}
.sp-card-hit{position:absolute;inset:0;z-index:3;border:0;border-radius:inherit;
  background:transparent;cursor:pointer;}
.sp-card-hit:focus-visible{outline:2px solid var(--blue);outline-offset:-3px;}
.sp-cover{position:relative;height:96px;overflow:hidden;border-bottom:1px solid var(--line);}
.sp-cover-mark{position:absolute;right:16px;bottom:-14px;font-size:60px;font-weight:800;
  letter-spacing:-.06em;color:rgba(20,19,26,.14);}
.sp-cover .sp-status{position:absolute;left:14px;top:14px;}
.sp-body{padding:16px;}
.sp-name{margin:0 0 4px;font-size:18px;font-weight:800;letter-spacing:-.025em;line-height:1.25;}
.sp-desc{margin:0 0 10px;color:var(--ink-dim);font-size:13px;line-height:1.5;
  overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;}
.sp-meta{display:flex;align-items:center;flex-wrap:wrap;gap:6px 14px;color:var(--ink-dim);font-size:12px;}
.sp-meta-item{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;}
.sp-meta b{color:var(--ink);font-weight:700;}
.sp-leaders{display:flex;gap:10px;margin:13px 0 12px;min-width:0;}
.sp-leader{display:flex;align-items:center;gap:7px;flex:1 1 0;min-width:0;}
.sp-av{width:26px;height:26px;border-radius:50%;background:#efebdd;border:1px solid #ded8c6;
  display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;
  font-size:9.5px;font-weight:800;letter-spacing:.02em;color:var(--ink-2);}
.sp-leader-txt{min-width:0;display:flex;flex-direction:column;line-height:1.25;}
.sp-leader-name{font-size:11px;font-weight:600;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sp-leader-votes{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--ink-dim);}
.sp-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;}
.sp-tag{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:999px;
  border:1px solid var(--line);font-size:11px;font-weight:700;color:var(--ink-dim);background:var(--panel-2);}
.sp-tag.free{color:var(--green);border-color:rgba(31,122,77,.24);background:var(--green-soft);}
.sp-tag.paid{color:#6b4c00;border-color:rgba(245,196,69,.55);background:var(--yellow-soft);}
.sp-tag.paused{color:var(--red);border-color:rgba(194,65,47,.26);background:var(--red-soft);}
.sp-tag.private{color:var(--ink-2);background:var(--panel-2);border-color:var(--line-strong);}
.sp-actions{position:relative;z-index:4;display:flex;}
.sp-actions .sp-btn{width:100%;}
.sp-status{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;
  font-size:11px;font-weight:700;border:1px solid var(--line-strong);color:var(--ink-2);
  background:rgba(255,253,247,.92);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}
.sp-status i{width:6px;height:6px;border-radius:50%;background:currentColor;display:block;}
.sp-status.live{color:#146b41;border-color:rgba(31,122,77,.3);background:rgba(215,242,228,.94);}
.sp-status.closing{color:#a2431a;border-color:rgba(242,104,42,.32);background:rgba(253,232,220,.95);}
.sp-status.upcoming{color:var(--ink-2);}
.sp-status.ended{color:var(--ink-dim);background:rgba(247,244,234,.95);}

/* event screen */
.sp-event{padding-bottom:124px;min-height:100vh;}
.sp-back{display:inline-flex;align-items:center;gap:8px;min-height:44px;margin-top:10px;
  background:none;border:0;color:var(--ink-dim);font-size:13px;font-weight:700;}
.sp-back:hover{color:var(--ink);}
.sp-ehero{padding:6px 0 24px;border-bottom:1px solid var(--line);}
.sp-etags{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;}
.sp-ehero h1{margin:0 0 10px;font-size:clamp(30px,7.4vw,48px);line-height:1.02;
  letter-spacing:-.045em;font-weight:800;}
.sp-edesc{margin:0;color:var(--ink-dim);font-size:15px;max-width:56ch;line-height:1.55;}
.sp-emeta{display:flex;flex-wrap:wrap;gap:14px 30px;margin-top:20px;}
.sp-emeta-item{display:flex;flex-direction:column;gap:2px;}
.sp-emeta-label{font-size:11px;font-weight:700;color:var(--ink-dim);letter-spacing:.08em;text-transform:uppercase;}
.sp-emeta-value{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums;
  font-size:17px;font-weight:700;min-width:64px;color:var(--ink);}
.sp-banner{display:flex;gap:10px;align-items:flex-start;border:1px solid var(--line);
  border-radius:16px;padding:13px 15px;margin-top:18px;font-size:13px;line-height:1.5;
  background:var(--panel);}
.sp-banner svg{flex-shrink:0;margin-top:1px;color:var(--ink-dim);}
.sp-banner strong{display:block;font-size:13.5px;font-weight:800;margin-bottom:1px;}
.sp-banner.closed{border-color:rgba(194,65,47,.26);background:var(--red-soft);}
.sp-banner.closed svg,.sp-banner.closed strong{color:var(--red);}
.sp-banner.paused{border-color:rgba(194,65,47,.2);background:#fdf1ee;}
.sp-voted{display:flex;align-items:center;justify-content:space-between;gap:12px;
  border:1px solid rgba(31,122,77,.24);background:var(--green-soft);
  border-radius:16px;padding:12px 15px;margin-top:16px;font-size:13px;}
.sp-voted strong{color:#146b41;font-weight:800;}
.sp-lb-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:26px 0 12px;}
.sp-lb-head h2{margin:0;font-size:17px;font-weight:800;letter-spacing:-.025em;}
.sp-lb-note{display:inline-flex;align-items:center;gap:6px;color:var(--ink-dim);font-size:12px;}
.sp-lb{display:flex;flex-direction:column;gap:8px;}
.sp-lbrow{display:flex;align-items:center;gap:10px;min-width:0;border:1px solid var(--line);
  border-radius:16px;background:var(--panel);padding:10px 12px;transition:border-color .15s;}
.sp-lbrow:hover{border-color:var(--line-strong);}
.sp-rank{width:18px;flex-shrink:0;font-family:'JetBrains Mono',monospace;font-size:12px;
  color:var(--mute);text-align:center;}
.sp-lbrow.lead .sp-rank{color:var(--orange);}
.sp-lbrow .sp-av{width:38px;height:38px;font-size:12px;}
.sp-lbinfo{min-width:0;flex:1 1 auto;}
.sp-lbname{display:flex;align-items:center;gap:5px;font-size:14px;font-weight:700;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sp-lbname svg{flex-shrink:0;color:var(--yellow);}
.sp-lbcat{color:var(--ink-dim);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sp-spark{display:block;flex-shrink:0;width:54px;height:20px;}
.sp-delta{display:inline-flex;align-items:center;gap:2px;font-family:'JetBrains Mono',monospace;
  font-size:10px;font-weight:700;padding:3px 7px;border-radius:999px;flex-shrink:0;}
.sp-delta.up{color:#146b41;background:var(--green-soft);}
.sp-delta.down{color:var(--red);background:var(--red-soft);}
.sp-lbvotes{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums;
  font-size:13px;font-weight:700;min-width:58px;text-align:right;flex-shrink:0;}
.sp-lbrow .sp-btn{flex-shrink:0;padding:0 18px;}
.sp-sticky{position:fixed;left:0;right:0;bottom:0;z-index:25;border-top:1px solid var(--line);
  background:rgba(243,241,233,.94);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  box-shadow:0 -8px 30px rgba(20,19,26,.06);
  padding:10px 0 calc(10px + env(safe-area-inset-bottom));}
.sp-sticky-in{display:flex;align-items:center;justify-content:space-between;gap:14px;}
.sp-sticky-text{font-size:12.5px;color:var(--ink-dim);min-width:0;line-height:1.4;}
.sp-sticky-text strong{display:block;color:var(--ink);font-size:13.5px;font-weight:800;}
.sp-sticky .sp-btn{flex-shrink:0;}

/* empty + skeleton + create */
.sp-empty{margin-top:30px;border:1px dashed var(--line-strong);border-radius:20px;
  padding:34px 20px;text-align:center;background:rgba(255,253,247,.6);}
.sp-empty h2{margin:0 0 6px;font-size:17px;font-weight:800;letter-spacing:-.02em;}
.sp-empty p{margin:0 0 18px;color:var(--ink-dim);font-size:13px;max-width:42ch;
  margin-left:auto;margin-right:auto;line-height:1.55;}
.sp-skel{margin-top:14px;height:220px;border-radius:20px;border:1px solid var(--line);
  background:linear-gradient(90deg,#f1eee3 25%,#fbf9f1 37%,#f1eee3 63%);
  background-size:400% 100%;animation:sp-shimmer 1.4s ease infinite;}
@keyframes sp-shimmer{from{background-position:100% 0}to{background-position:0 0}}
.sp-create{margin:38px 0 10px;border:1px dashed var(--line-strong);border-radius:22px;
  padding:28px 22px;text-align:center;background:rgba(255,253,247,.65);}
.sp-create h2{margin:0 0 6px;font-size:19px;font-weight:800;letter-spacing:-.03em;}
.sp-create p{margin:0 auto 18px;max-width:40ch;color:var(--ink-dim);font-size:13.5px;line-height:1.55;}
.sp-create .sp-btn{max-width:280px;margin:0 auto;}

/* sheets + modals */
.sp-backdrop{position:fixed;inset:0;z-index:60;display:flex;align-items:flex-end;justify-content:center;
  background:rgba(20,19,26,.42);animation:sp-fade .16s ease-out;overflow-y:auto;}
.sp-sheet{width:100%;max-width:480px;max-height:92vh;overflow-y:auto;background:var(--panel);
  border:1px solid var(--line);border-bottom:0;border-radius:22px 22px 0 0;
  padding:12px 20px calc(20px + env(safe-area-inset-bottom));
  box-shadow:0 -20px 60px rgba(20,19,26,.2);animation:sp-up .2s ease-out;}
.sp-grab{width:38px;height:4px;border-radius:999px;background:var(--line-strong);margin:0 auto 14px;}
.sp-sheet-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
.sp-sheet h2{margin:0 0 2px;font-size:20px;font-weight:800;letter-spacing:-.03em;}
.sp-sheet-body{color:var(--ink-dim);font-size:12.5px;margin:0;line-height:1.5;}
.sp-close{width:44px;height:44px;flex-shrink:0;border-radius:999px;border:1px solid var(--line);
  background:var(--panel-2);color:var(--ink);display:flex;align-items:center;justify-content:center;}
.sp-close:hover{background:#efeade;border-color:var(--line-strong);}
.sp-box{border:1px solid var(--line);border-radius:16px;padding:15px;margin-top:14px;background:var(--panel-2);}
.sp-box h3{margin:0 0 4px;font-size:14px;font-weight:800;}
.sp-box p{margin:0;color:var(--ink-dim);font-size:12.5px;line-height:1.55;}
.sp-stepper{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 0 10px;}
.sp-stepbtn{width:44px;height:44px;border-radius:999px;border:1px solid var(--line-strong);
  background:var(--panel);color:var(--ink);display:flex;align-items:center;justify-content:center;
  transition:background .15s,border-color .15s;}
.sp-stepbtn:hover{background:#efeade;}
.sp-stepbtn:disabled{opacity:.4;cursor:not-allowed;}
.sp-qty{font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;
  min-width:48px;text-align:center;font-variant-numeric:tabular-nums;}
.sp-total{display:flex;align-items:baseline;justify-content:space-between;gap:12px;
  margin:4px 0 14px;font-size:14px;font-weight:700;}
.sp-total b{font-family:'JetBrains Mono',monospace;font-size:18px;font-variant-numeric:tabular-nums;}
.sp-payline{display:flex;justify-content:space-between;gap:12px;padding:10px 0;
  border-bottom:1px solid var(--line);font-size:13.5px;}
.sp-payline:last-of-type{border-bottom:0;}
.sp-payline span{color:var(--ink-dim);}
.sp-payline b{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums;}
.sp-note{display:flex;gap:8px;margin:12px 0 16px;color:var(--ink-dim);font-size:12px;line-height:1.55;}
.sp-note svg{flex-shrink:0;margin-top:1px;color:var(--green);}
.sp-sheet-actions{display:flex;gap:8px;margin-top:16px;}
.sp-sheet-actions .sp-btn{flex:1;}
.sp-success{text-align:center;padding:8px 0 4px;}
.sp-success-ic{width:56px;height:56px;border-radius:50%;background:var(--green-soft);
  color:#146b41;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;}
.sp-success h2{margin:0 0 4px;}
.sp-success p{color:var(--ink-dim);font-size:13px;margin:0 0 18px;}
.sp-auth{padding-bottom:24px;}
.sp-auth .sp-btn{margin-top:8px;}
.sp-auth-ic{width:46px;height:46px;border-radius:50%;border:1px solid var(--line);
  background:var(--blue-soft);display:flex;align-items:center;justify-content:center;
  margin-bottom:12px;color:var(--blue);}

/* sign-in form */
.sp-auth-form{display:flex;flex-direction:column;gap:12px;margin-top:18px;}
.sp-field{display:flex;flex-direction:column;gap:6px;}
.sp-field label{font-size:12.5px;font-weight:700;color:var(--ink);}
.sp-field-in{position:relative;display:flex;align-items:center;}
.sp-field-in>svg{position:absolute;left:14px;color:var(--ink-dim);pointer-events:none;}
.sp-field-in input{width:100%;height:48px;border-radius:12px;border:1px solid var(--line);
  background:var(--paper);color:var(--ink);padding:0 48px 0 40px;font-size:14px;min-width:0;}
.sp-field-in input::placeholder{color:var(--mute);}
.sp-field-in input:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(59,91,245,.14);}
.sp-field-in input[aria-invalid="true"]{border-color:var(--red);}
.sp-reveal{position:absolute;right:3px;width:44px;height:44px;border:0;border-radius:999px;
  background:none;color:var(--ink-dim);display:flex;align-items:center;justify-content:center;}
.sp-reveal:hover{background:var(--panel-2);color:var(--ink);}
.sp-auth-error{display:flex;align-items:flex-start;gap:7px;margin:0;padding:10px 12px;
  border:1px solid rgba(194,65,47,.28);border-radius:12px;background:var(--red-soft);
  color:var(--red);font-size:12.5px;font-weight:600;line-height:1.45;}
.sp-auth-error svg{flex-shrink:0;margin-top:1px;}
.sp-auth-hint{margin:0;padding:10px 12px;border:1px dashed var(--line-strong);border-radius:12px;
  background:var(--panel-2);color:var(--ink-dim);font-size:12px;line-height:1.55;}
.sp-auth-hint b{font-family:'JetBrains Mono',monospace;font-weight:600;color:var(--ink);}
.sp-auth-switch{margin:0;text-align:center;font-size:12.5px;color:var(--ink-dim);}
.sp-auth-switch button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;
  background:none;border:0;color:var(--ink);font-size:12.5px;font-weight:800;
  text-decoration:underline;text-underline-offset:3px;padding:0 4px;}

/* profile */
.sp-profile{padding-bottom:48px;}
.sp-profile .sp-top-in{max-width:760px;}
.sp-wrap.sp-profile-main{max-width:760px;padding-top:28px;}
.sp-profile-head{display:flex;align-items:center;gap:16px;padding-bottom:22px;
  border-bottom:1px solid var(--line);}
.sp-avatar-lg{width:64px;height:64px;border-radius:50%;flex-shrink:0;
  background:var(--blue-soft);border:1px solid rgba(59,91,245,.24);color:var(--blue-dark);
  display:flex;align-items:center;justify-content:center;
  font-size:20px;font-weight:800;letter-spacing:-.02em;}
.sp-profile-id{min-width:0;}
.sp-profile-id .sp-eyebrow{margin-bottom:6px;}
.sp-profile-id h1{margin:0 0 4px;font-size:clamp(24px,6vw,32px);line-height:1.05;
  letter-spacing:-.04em;font-weight:800;overflow-wrap:anywhere;}
.sp-profile-email{display:flex;align-items:center;gap:6px;margin:0;
  color:var(--ink-dim);font-size:13px;overflow-wrap:anywhere;}
.sp-profile-email svg{flex-shrink:0;}
.sp-profile-since{margin:3px 0 0;color:var(--mute);font-size:12px;}
.sp-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:20px;}
.sp-stat{border:1px solid var(--line);border-radius:16px;background:var(--panel);padding:13px 14px;}
.sp-stat-label{display:block;margin-bottom:4px;font-size:10.5px;font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;color:var(--ink-dim);}
.sp-stat b{font-size:19px;font-weight:700;letter-spacing:-.02em;}
.sp-history{display:flex;flex-direction:column;gap:8px;}
.sp-history-row{display:flex;align-items:center;gap:12px;min-width:0;
  border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:12px 14px;}
.sp-history-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:var(--green);}
.sp-history-dot.paid{background:var(--yellow);}
.sp-history-main{min-width:0;flex:1 1 auto;}
.sp-history-name{font-size:13.5px;font-weight:700;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis;}
.sp-history-event{font-size:11.5px;color:var(--ink-dim);white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis;}
.sp-history-side{text-align:right;flex-shrink:0;}
.sp-history-qty{display:block;font-size:12.5px;font-weight:700;}
.sp-history-meta{display:block;font-size:11px;color:var(--ink-dim);}
.sp-profile-empty{text-align:left;padding:24px 20px;margin-top:0;}
.sp-profile-empty p{margin-left:0;margin-right:0;max-width:46ch;}
.sp-profile-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:26px;}
.sp-profile-actions .sp-btn{flex:1 1 150px;}
@media (min-width:640px){
  .sp-profile-actions .sp-btn{flex:0 0 auto;min-width:190px;}
}

/* toast + sr */
.sp-toast{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:90;
  display:flex;align-items:center;gap:8px;max-width:calc(100vw - 32px);
  background:var(--ink);color:#fff;border-radius:999px;padding:11px 18px;
  font-size:13px;font-weight:700;box-shadow:0 16px 44px rgba(20,19,26,.32);
  animation:sp-fade .18s ease-out;}
.sp-toast svg{flex-shrink:0;color:#8fe0b4;}
@keyframes sp-fade{from{opacity:0}to{opacity:1}}
@keyframes sp-up{from{opacity:.5;transform:translateY(18px)}to{opacity:1;transform:none}}

/* wide screens */
@media (min-width:900px){
  .sp-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;}
}
@media (min-width:1024px){
  .sp-wrap{max-width:1120px;padding:0 32px;}
  .sp-head{padding-top:44px;}
  .sp-menu{right:32px;}
  .sp-grid{max-width:100%;}
  .sp-sticky-in{max-width:1120px;margin:0 auto;padding:0 32px;}
  .sp-create{padding:32px;}
}
@media (min-width:640px){
  .sp-backdrop{align-items:center;padding:24px;}
  .sp-sheet{border-bottom:1px solid var(--line);border-radius:22px;padding:16px 24px 24px;}
  .sp-stats{grid-template-columns:repeat(4,minmax(0,1fr));}
}
@media (max-width:480px){
  .sp-cover{height:84px;}
  .sp-leaders{gap:7px;}
  .sp-leader-name{font-size:10.5px;}
  .sp-emeta{gap:12px 22px;}
  .sp-lbrow .sp-spark{display:none;}
  .sp-lbrow .sp-delta{display:none;}
  .sp-lbvotes{min-width:50px;font-size:12.5px;}
  .sp-lbrow .sp-btn{padding:0 14px;font-size:13px;}
  .sp-lbrow{gap:8px;padding:10px;}
}
@media (prefers-reduced-motion:reduce){
  .sp *{animation-duration:.001ms !important;animation-iteration-count:1 !important;
    transition-duration:.001ms !important;}
  .sp-card:hover{transform:none;}
}
`;

function Sparkline({ data, className = "" }) {
  if (!data || data.length < 2) return <span className={"sp-spark " + className} />;
  const w = 54;
  const h = 20;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * w;
      const y = h - 2 - ((value - min) / range) * (h - 4);
      return x.toFixed(1) + "," + y.toFixed(1);
    })
    .join(" ");
  return (
    <svg className={"sp-spark " + className} width={w} height={h} viewBox={"0 0 " + w + " " + h} aria-hidden="true">
      <polyline points={points} fill="none" stroke="#3B5BF5" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatusBadge({ status, className = "" }) {
  return (
    <span className={"sp-status " + status + (className ? " " + className : "")}>
      <i /> {STATUS[status].label}
    </span>
  );
}

function EventCard({ event, now, onOpen, onVote, onRemind, reminded }) {
  const status = statusOf(event, now);
  const top = ranked(event).slice(0, 3);
  const paused = event.votingDisabled;

  let primary;
  if (status === "ended") {
    primary = (
      <button className="sp-btn block" onClick={onOpen}>View results</button>
    );
  } else if (status === "upcoming") {
    primary = (
      <button className="sp-btn block" onClick={onRemind} aria-pressed={reminded}>
        {reminded ? <BellRing size={15} /> : <Bell size={15} />}
        {reminded ? "Reminder set" : "Remind me"}
      </button>
    );
  } else if (paused) {
    primary = (
      <button className="sp-btn block" disabled>Voting paused</button>
    );
  } else {
    primary = (
      <button className="sp-btn primary block" onClick={onVote}>Vote</button>
    );
  }

  return (
    <article className="sp-card" aria-label={event.name}>
      <button className="sp-card-hit" aria-label={"Open " + event.name} onClick={onOpen} />
      <div className="sp-cover" style={{ background: event.cover }}>
        <StatusBadge status={status} />
        <span className="sp-cover-mark" aria-hidden="true">{initials(event.name)}</span>
      </div>
      <div className="sp-body">
        <h3 className="sp-name">{event.name}</h3>
        <p className="sp-desc">{event.description}</p>

        <div className="sp-meta">
          <span className="sp-meta-item">
            <Clock3 size={12} />
            {status === "ended"
              ? "Ended"
              : status === "upcoming"
                ? startsIn(event.startsAt - now)
                : timeLeft(event.endsAt - now)}
          </span>
          <span className="sp-meta-item">{count(event.contestants.length)} contestants</span>
          <span className="sp-meta-item">
            <span className="sp-num" style={{ minWidth: 46, textAlign: "right" }}>
              {count(totalVotes(event))}
            </span>
            <b>votes</b>
          </span>
        </div>

        {top.length > 0 && (
          <div className="sp-leaders" aria-label="Current leaders">
            {top.map((c) => (
              <div className="sp-leader" key={c.id}>
                <span className="sp-av">{initials(c.name)}</span>
                <span className="sp-leader-txt">
                  <span className="sp-leader-name">{c.name}</span>
                  <span className="sp-leader-votes">{count(c.votes)}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {status !== "ended" && (
          <div className="sp-tags">
            {paused && <span className="sp-tag paused">Voting paused</span>}
            {!paused && event.freeVotingEnabled && (
              <span className="sp-tag free">Free vote</span>
            )}
            {!paused && event.paidVotingEnabled && (
              <span className="sp-tag paid">{naira(event.paidVotePrice)} / vote</span>
            )}
            {!paused && !event.freeVotingEnabled && !event.paidVotingEnabled && (
              <span className="sp-tag">Voting closed</span>
            )}
          </div>
        )}

        <div className="sp-actions">{primary}</div>
      </div>
    </article>
  );
}

export default function StagePickApp({
  startSignedIn = false,
  onOpenOrganizer = null,
  initialAccount = null,
  onSignIn = null,
  onSignOut = null,
}) {
  const initialDeep = useMemo(() => {
    const hash = window.location.hash || "";
    const match = hash.match(/\/e\/([^/?#]+)/);
    const param = new URLSearchParams(window.location.search).get("event");
    return findEvent(SEED_EVENTS, match ? match[1] : param);
  }, []);

  const [now, setNow] = useState(BOOT);
  const [events, setEvents] = useState(SEED_EVENTS);
  const [loading, setLoading] = useState(!initialDeep);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState("");
  const [activeId, setActiveId] = useState(initialDeep ? initialDeep.id : null);
  const [signedIn, setSignedIn] = useState(Boolean(startSignedIn || initialAccount));
  const [account, setAccount] = useState(
    initialAccount || (startSignedIn ? GUEST_ACCOUNT : null),
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signin"); // "signin" | "signup"
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [voteFlow, setVoteFlow] = useState(null);
  const [freeVotesUsed, setFreeVotesUsed] = useState({});
  const [myVotes, setMyVotes] = useState([]);
  const [lastVote, setLastVote] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [toast, setToast] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const pendingRef = useRef(null);

  /* Clock, boot skeleton, toast lifetime, deep links. */
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(id);
  }, [toast]);

  /* Escape closes the menu, overlays, and the profile screen. */
  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      setAuthOpen(false);
      setVoteFlow(null);
      setProfileOpen(false);
      pendingRef.current = null;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* If an event ends while the vote sheet is open, close it and say so. */
  useEffect(() => {
    if (!voteFlow) return undefined;
    const event = events.find((item) => item.id === voteFlow.eventId);
    if (event && now >= event.endsAt) {
      const id = setTimeout(() => {
        setVoteFlow(null);
        setToast("Voting closed — that event ended. Nothing was charged.");
      }, 0);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [now, voteFlow, events]);

  const publicEvents = useMemo(
    () => events.filter((event) => event.visibility === "public"),
    [events],
  );

  const statuses = useMemo(() => {
    const map = {};
    events.forEach((event) => {
      map[event.id] = statusOf(event, now);
    });
    return map;
  }, [events, now]);

  const activeEvent = activeId ? events.find((event) => event.id === activeId) : null;
  const activeStatus = activeEvent ? statuses[activeEvent.id] : null;
  const activeVotes = useMemo(
    () => (activeEvent ? ranked(activeEvent) : []),
    [activeEvent],
  );
  const activeTotal = activeEvent ? totalVotes(activeEvent) : 0;
  const activeFreeLeft = activeEvent
    ? Math.max(0, activeEvent.freeVoteLimit - (freeVotesUsed[activeEvent.id] || 0))
    : 0;
  const voteEvent = voteFlow ? events.find((event) => event.id === voteFlow.eventId) : null;
  const voteContestant =
    voteEvent && voteFlow
      ? voteEvent.contestants.find((c) => c.id === voteFlow.contestantId)
      : null;
  const freeLeft = voteEvent
    ? Math.max(0, voteEvent.freeVoteLimit - (freeVotesUsed[voteEvent.id] || 0))
    : 0;

  const matching = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return publicEvents.filter((event) => {
      const status = statuses[event.id];
      const byFilter =
        filter === "all" ||
        (filter === "live" && (status === "live" || status === "closing")) ||
        filter === status;
      if (!byFilter) return false;
      if (!needle) return true;
      const haystack = [
        event.name,
        event.description,
        ...event.contestants.map((c) => c.name + " " + c.category),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [publicEvents, statuses, filter, query]);

  const sections = useMemo(() => {
    const bucket = { live: [], closing: [], upcoming: [], ended: [] };
    matching.forEach((event) => bucket[statuses[event.id]].push(event));
    return bucket;
  }, [matching, statuses]);

  const chipCounts = useMemo(() => {
    const counts = { all: publicEvents.length, live: 0, closing: 0, upcoming: 0, ended: 0 };
    publicEvents.forEach((event) => {
      const status = statuses[event.id];
      counts[status] += 1;
      if (status === "closing") counts.live += 1;
    });
    return counts;
  }, [publicEvents, statuses]);

  const activity = useMemo(() => {
    const byEvent = new Map();
    myVotes.forEach((vote) => {
      if (!byEvent.has(vote.eventId)) {
        byEvent.set(vote.eventId, {
          eventId: vote.eventId,
          names: [],
          total: 0,
          count: 0,
        });
      }
      const entry = byEvent.get(vote.eventId);
      if (!entry.names.includes(vote.name)) entry.names.push(vote.name);
      entry.total += vote.quantity;
      entry.count += 1;
    });
    return [...byEvent.values()].map((entry) => {
      const event = events.find((item) => item.id === entry.eventId);
      return {
        ...entry,
        event,
        freeLeft: event
          ? Math.max(0, event.freeVoteLimit - (freeVotesUsed[event.id] || 0))
          : 0,
      };
    });
  }, [myVotes, events, freeVotesUsed]);

  // Profile summary — same vote log the activity strip uses, so the numbers
  // always agree with what the voter just did.
  const profile = account || GUEST_ACCOUNT;
  const profileVotes = myVotes.reduce((sum, vote) => sum + vote.quantity, 0);
  const profileEvents = new Set(myVotes.map((vote) => vote.eventId)).size;
  const profilePaidSpend = myVotes.reduce(
    (sum, vote) => (vote.type === "paid" ? sum + vote.quantity * vote.price : sum),
    0,
  );
  const profileFreeUsed = Object.values(freeVotesUsed).reduce((sum, used) => sum + used, 0);

  const note = (message) => setToast(message);

  const goOrganizer = (wizard = false) => {
    setMenuOpen(false);
    setProfileOpen(false);
    if (onOpenOrganizer) {
      onOpenOrganizer(wizard);
      return;
    }
    note("Open the organiser dashboard from the account menu.");
  };

  const openEvent = (event) => {
    setActiveId(event.id);
    setMenuOpen(false);
    setProfileOpen(false);
    setVoteFlow(null);
    setAuthOpen(false);
    setLinkError("");
    if (typeof window.scrollTo === "function") window.scrollTo(0, 0);
  };

  const backHome = () => {
    setActiveId(null);
    setVoteFlow(null);
    if (typeof window.scrollTo === "function") window.scrollTo(0, 0);
  };

  const submitLink = (event) => {
    event.preventDefault();
    if (!linkValue.trim()) {
      setLinkError("Paste the event link or code first.");
      return;
    }
    const found = findEvent(events, linkValue);
    if (!found) {
      setLinkError("That link doesn't match an event. Check the code and try again.");
      return;
    }
    setLinkValue("");
    setLinkError("");
    openEvent(found);
  };

  const toggleRemind = (event) => {
    setReminders((prev) => {
      if (prev.includes(event.id)) {
        note("Reminder removed for " + event.name + ".");
        return prev.filter((id) => id !== event.id);
      }
      note("Reminder set. We'll nudge you when " + event.name + " starts.");
      return [...prev, event.id];
    });
  };

  const openAuth = (mode = "signin", action = null) => {
    setAuthMode(mode);
    setAuthForm({ name: "", email: "", password: "" });
    setAuthError("");
    setShowPass(false);
    pendingRef.current = action;
    setAuthOpen(true);
  };

  const guard = (action) => {
    if (signedIn) {
      action();
      return;
    }
    openAuth("signin", action);
  };

  const updateAuthField = (key) => (event) => {
    const { value } = event.target;
    setAuthForm((current) => ({ ...current, [key]: value }));
    if (authError) setAuthError("");
  };

  const completeSignIn = (next) => {
    const user = next || GUEST_ACCOUNT;
    setAccount(publicAccount(user));
    setSignedIn(true);
    setAuthOpen(false);
    setAuthError("");
    setAuthForm({ name: "", email: "", password: "" });
    setShowPass(false);
    note("Signed in as " + user.name + ".");
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) pending();
  };

  const submitAuth = (event) => {
    event.preventDefault();

    const name = authForm.name.trim();
    const email = authForm.email.trim();
    const password = authForm.password;

    if (authMode === "signup" && name.length < 2) {
      setAuthError("Enter your name so organisers know who voted.");
      return;
    }

    if (!EMAIL_RE.test(email)) {
      setAuthError("Enter a valid email address, like ada@example.com.");
      return;
    }

    if (password.length < 8) {
      setAuthError("Passwords need at least 8 characters.");
      return;
    }

    if (onSignIn) {
      const result = onSignIn({ mode: authMode, name, email, password });
      if (result && result.ok === false) {
        setAuthError(result.error || "We couldn't sign you in. Try again.");
        return;
      }
      completeSignIn(
        (result && result.account) || {
          name: name || "StagePick voter",
          email,
          joined: "Member since today",
        },
      );
      return;
    }

    // Standalone fallback (no credential store): any valid email with an
    // 8+ character password is accepted, so the screen still works alone.
    completeSignIn({
      name: name || "StagePick voter",
      email,
      joined: "Member since today",
    });
  };

  const switchAuthMode = () => {
    setAuthMode((mode) => (mode === "signin" ? "signup" : "signin"));
    setAuthError("");
  };

  const openProfile = () => {
    setMenuOpen(false);

    if (!signedIn) {
      note("Sign in to see your profile and vote history.");
      openAuth("signin", null);
      return;
    }

    setActiveId(null);
    setProfileOpen(true);
    if (typeof window.scrollTo === "function") window.scrollTo(0, 0);
  };

  const closeProfile = () => {
    setProfileOpen(false);
    if (typeof window.scrollTo === "function") window.scrollTo(0, 0);
  };

  const closeAuth = () => {
    setAuthOpen(false);
    setAuthError("");
    pendingRef.current = null;
  };

  const signOut = () => {
    setMenuOpen(false);
    setProfileOpen(false);
    setSignedIn(false);
    setAccount(null);
    setAuthError("");
    if (onSignOut) onSignOut();
    note("Signed out. You can still browse every event.");
  };

  const applyVotes = (eventId, contestantId, quantity) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id !== eventId
          ? event
          : {
              ...event,
              contestants: event.contestants.map((c) =>
                c.id !== contestantId
                  ? c
                  : {
                      ...c,
                      votes: c.votes + quantity,
                      delta: Math.max(1, (c.delta || 0) + quantity),
                      trend: [...c.trend.slice(1), c.votes + quantity],
                    },
              ),
            },
      ),
    );
  };

  const recordVote = (event, contestant, type, quantity, price) => {
    setMyVotes((prev) => [
      {
        id: "v-" + Date.now() + "-" + Math.random().toString(16).slice(2),
        eventId: event.id,
        eventName: event.name,
        contestantId: contestant.id,
        name: contestant.name,
        type,
        quantity,
        price,
        at: Date.now(),
      },
      ...prev,
    ]);
    setLastVote({
      eventId: event.id,
      contestantId: contestant.id,
      name: contestant.name,
      quantity,
      type,
    });
  };

  const castFree = (event, contestant) => {
    const left = Math.max(0, event.freeVoteLimit - (freeVotesUsed[event.id] || 0));
    if (left <= 0) return;
    guard(() => {
      applyVotes(event.id, contestant.id, 1);
      setFreeVotesUsed((prev) => ({ ...prev, [event.id]: (prev[event.id] || 0) + 1 }));
      recordVote(event, contestant, "free", 1, 0);
      setVoteFlow(null);
      note("Free vote counted for " + contestant.name + ".");
      setAnnouncement(
        "Vote counted. " + contestant.name + " now has " + count(contestant.votes + 1) + " votes.",
      );
    });
  };

  const openVote = (event, contestant) => {
    if (now >= event.endsAt) return;
    if (now < event.startsAt) {
      note("Voting opens when the event starts.");
      return;
    }
    if (event.votingDisabled) {
      note("Voting is paused by the organiser.");
      return;
    }
    setVoteFlow({ eventId: event.id, contestantId: contestant.id, step: "choose", qty: 1 });
  };

  const startPayment = () => {
    guard(() => setVoteFlow((flow) => (flow ? { ...flow, step: "confirm" } : flow)));
  };

  const castPaid = (event, contestant) => {
    const quantity = voteFlow ? voteFlow.qty : 0;
    if (!quantity) return;
    applyVotes(event.id, contestant.id, quantity);
    recordVote(event, contestant, "paid", quantity, event.paidVotePrice);
    setVoteFlow(null);
    note(quantity + (quantity === 1 ? " paid vote" : " paid votes") + " counted for " + contestant.name + ".");
    setAnnouncement(
      quantity +
        " paid votes counted. " +
        contestant.name +
        " now has " +
        count(contestant.votes + quantity) +
        " votes.",
    );
  };

  const shareEvent = (event) => {
    const link =
      (typeof window !== "undefined" ? window.location.origin : "https://stagepick.app") +
      "/#/e/" +
      event.slug;
    const done = () => note("Link copied — send it to your friends.");
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(done).catch(() =>
          note("Couldn't copy — select the link from the address bar."),
        );
        return;
      }
      throw new Error("no clipboard");
    } catch {
      const field = document.createElement("textarea");
      field.value = link;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      try {
        document.execCommand("copy");
        done();
      } catch {
        note("Couldn't copy — select the link from the address bar.");
      }
      document.body.removeChild(field);
    }
  };

  const renderSection = (key, title, list, hint) => {
    if (!list.length) return null;
    return (
      <section className={"sp-sec sp-sec-" + key} aria-labelledby={"sp-sec-" + key}>
        <div className="sp-sec-head">
          <h2 id={"sp-sec-" + key}>{title}</h2>
          <span className="sp-sec-count">{list.length}</span>
          {hint && <span className="sp-sec-note">{hint}</span>}
        </div>
        <div className="sp-cards">
          {list.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              now={now}
              onOpen={() => openEvent(event)}
              onVote={() => openEvent(event)}
              onRemind={() => toggleRemind(event)}
              reminded={reminders.includes(event.id)}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="sp">

      {!activeEvent && profileOpen && (
        <div className="sp-profile">
          <header className="sp-top">
            <div className="sp-wrap sp-top-in">
              <div className="sp-logo">StagePick<span className="sp-logo-dot">.</span></div>
              <button
                type="button"
                className="sp-icon"
                aria-label="Close profile"
                onClick={closeProfile}
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <main className="sp-wrap sp-profile-main" id="sp-main">
            <section className="sp-profile-head" aria-labelledby="sp-profile-name">
              <div className="sp-avatar-lg" aria-hidden="true">{initials(profile.name)}</div>
              <div className="sp-profile-id">
                <span className="sp-eyebrow"><i aria-hidden="true" /> Your account</span>
                <h1 id="sp-profile-name">{profile.name}</h1>
                <p className="sp-profile-email"><Mail size={13} aria-hidden="true" /> {profile.email}</p>
                <p className="sp-profile-since">{profile.joined}</p>
              </div>
            </section>

            <div className="sp-stats">
              <div className="sp-stat">
                <span className="sp-stat-label">Votes cast</span>
                <b className="sp-num">{count(profileVotes)}</b>
              </div>
              <div className="sp-stat">
                <span className="sp-stat-label">Events</span>
                <b className="sp-num">{count(profileEvents)}</b>
              </div>
              <div className="sp-stat">
                <span className="sp-stat-label">Free votes used</span>
                <b className="sp-num">{count(profileFreeUsed)}</b>
              </div>
              <div className="sp-stat">
                <span className="sp-stat-label">Paid spend</span>
                <b className="sp-num">{naira(profilePaidSpend)}</b>
              </div>
            </div>

            <section className="sp-sec" aria-labelledby="sp-history-title">
              <div className="sp-sec-head">
                <h2 id="sp-history-title">Vote history</h2>
                {myVotes.length > 0 && (
                  <span className="sp-sec-count">{myVotes.length} {myVotes.length === 1 ? "entry" : "entries"}</span>
                )}
              </div>

              {myVotes.length === 0 ? (
                <div className="sp-empty sp-profile-empty">
                  <h2>No votes yet</h2>
                  <p>
                    Free and paid votes appear here with the contestant, event and receipt — so you
                    always know what you backed.
                  </p>
                  <button type="button" className="sp-btn primary" onClick={closeProfile}>
                    Find events
                  </button>
                </div>
              ) : (
                <div className="sp-history">
                  {myVotes.map((vote) => (
                    <div className="sp-history-row" key={vote.id}>
                      <span className={"sp-history-dot " + vote.type} aria-hidden="true" />
                      <div className="sp-history-main">
                        <div className="sp-history-name">{vote.name}</div>
                        <div className="sp-history-event">{vote.eventName}</div>
                      </div>
                      <div className="sp-history-side">
                        <span className="sp-history-qty sp-num">
                          {vote.quantity} {vote.quantity === 1 ? "vote" : "votes"}
                        </span>
                        <span className="sp-history-meta">
                          {vote.type === "free" ? "Free" : naira(vote.quantity * vote.price)} ·{" "}
                          {dayLabel(vote.at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="sp-profile-actions">
              <button type="button" className="sp-btn primary" onClick={closeProfile}>
                Find events
              </button>
              <button type="button" className="sp-btn" onClick={signOut}>
                <LogOut size={15} aria-hidden="true" /> Sign out
              </button>
            </div>
          </main>
        </div>
      )}

      {!activeEvent && !profileOpen && (
        <div className="sp-home">
          <header className="sp-top">
            <div className="sp-wrap sp-top-in">
              <div className="sp-logo">StagePick<span className="sp-logo-dot">.</span></div>
              <div className="sp-top-right">
                <button type="button" className="sp-nav-link" onClick={() => goOrganizer(false)}>
                  <BarChart3 size={14} aria-hidden="true" /> Organiser
                </button>
                <button
                  type="button"
                  className="sp-icon"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  {menuOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
              </div>
            </div>

            {menuOpen && (
              <div className="sp-menu" role="menu" aria-label="Account menu">
                {signedIn && (
                  <div className="sp-menu-user">
                    <span className="sp-av" aria-hidden="true">{initials(profile.name)}</span>
                    <div>
                      <b>{profile.name}</b>
                      <small>{profile.email}</small>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={openProfile}
                >
                  <User size={15} /> My profile
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={openProfile}
                >
                  <Ticket size={15} /> My votes
                </button>
                <hr />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => goOrganizer(false)}
                >
                  <BarChart3 size={15} /> Organiser dashboard
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => goOrganizer(true)}
                >
                  <Plus size={15} /> Create an event
                </button>
                <hr />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    if (signedIn) {
                      signOut();
                    } else {
                      setMenuOpen(false);
                      openAuth("signin", null);
                    }
                  }}
                >
                  <LogOut size={15} /> {signedIn ? "Sign out" : "Sign in"}
                </button>
              </div>
            )}
          </header>

          <main className="sp-wrap" id="sp-main">
            <div className="sp-head">
              <span className="sp-eyebrow"><i aria-hidden="true" /> Browse free — sign in only to vote</span>
              <h1>Live events</h1>
              <p className="sp-sub">
                Find a contest, vote free or paid, and see where your votes go.
              </p>
            </div>

            <form className="sp-linkbox" onSubmit={submitLink} noValidate>
              <label className="sp-label" htmlFor="sp-link">
                <Link2 size={13} /> Have an event link?
              </label>
              <div className="sp-row">
                <input
                  id="sp-link"
                  className="sp-input"
                  type="text"
                  value={linkValue}
                  onChange={(event) => {
                    setLinkValue(event.target.value);
                    if (linkError) setLinkError("");
                  }}
                  placeholder="Paste a link or code"
                  autoComplete="off"
                  aria-invalid={Boolean(linkError)}
                  aria-describedby={linkError ? "sp-link-error" : undefined}
                />
                <button type="submit" className="sp-btn">Open</button>
              </div>
              {linkError && (
                <p className="sp-err" id="sp-link-error" role="alert">
                  <AlertCircle size={13} /> {linkError}
                </p>
              )}
            </form>

            <div className="sp-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search events or contestants"
                aria-label="Search events"
              />
              {query && (
                <button
                  type="button"
                  className="sp-search-clear"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="sp-chips" role="group" aria-label="Filter events">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={"sp-chip" + (filter === item.key ? " on" : "")}
                  aria-pressed={filter === item.key}
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                  <b>{chipCounts[item.key]}</b>
                </button>
              ))}
            </div>

            <div className="sp-grid">
              {activity.length > 0 && (
                <section className="sp-activity" id="sp-activity" aria-labelledby="sp-act-h">
                  <h2 className="sp-h2" id="sp-act-h">Your activity</h2>
                  {activity.map((entry) =>
                    entry.event ? (
                      <div className="sp-act-card" key={entry.eventId}>
                        <div className="sp-act-main">
                          <div className="sp-act-name">
                            You voted for {entry.names[0]}
                            {entry.total > 1 ? " +" + (entry.total - 1) + " more" : ""}
                          </div>
                          <div className="sp-act-meta">
                            <span>{entry.event.name}</span>
                            <span className="sp-freeleft">
                              {entry.freeLeft} free {entry.freeLeft === 1 ? "vote" : "votes"} left
                            </span>
                          </div>
                        </div>
                        <div className="sp-act-side">
                          <button
                            type="button"
                            className="sp-link"
                            onClick={() => openEvent(entry.event)}
                          >
                            Back to event
                          </button>
                        </div>
                      </div>
                    ) : null,
                  )}
                </section>
              )}

              {loading ? (
                <div className="sp-sec">
                  <div className="sp-skel" />
                  <div className="sp-skel" />
                </div>
              ) : matching.length === 0 ? (
                <div className="sp-empty">
                  <h2>{publicEvents.length === 0 ? "No events yet" : "No matches"}</h2>
                  <p>
                    {publicEvents.length === 0
                      ? "New events appear here as soon as they go live."
                      : "Nothing matches that search or filter. Try another word, or clear the filters."}
                  </p>
                  {(query || filter !== "all") && (
                    <button
                      type="button"
                      className="sp-btn primary"
                      onClick={() => {
                        setQuery("");
                        setFilter("all");
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {renderSection("live", "Live now", sections.live)}
                  {renderSection("closing", "Closing soon", sections.closing, "Under 24 hours left")}
                  {renderSection("upcoming", "Upcoming", sections.upcoming)}
                  {renderSection("ended", "Ended", sections.ended)}
                </>
              )}

              {!loading && (
                <section className="sp-create" aria-labelledby="sp-create-h">
                  <h2 id="sp-create-h">Running a contest?</h2>
                  <p>Create an event and let your audience vote free or paid. You set the price.</p>
                  <button
                    type="button"
                    className="sp-btn block"
                    onClick={() => goOrganizer(true)}
                  >
                    Create event
                  </button>
                </section>
              )}
            </div>
          </main>
        </div>
      )}

      {activeEvent && (
        <div className="sp-event">
          <div className="sp-wrap">
            <button type="button" className="sp-back" onClick={backHome}>
              <ArrowLeft size={15} /> All events
            </button>

            <div className="sp-ehero">
              <div className="sp-etags">
                <StatusBadge status={activeStatus} />
                {activeEvent.visibility === "private" && (
                  <span className="sp-tag private">
                    <Lock size={11} /> Private
                  </span>
                )}
                <span className="sp-tag">{activeEvent.contestants.length} contestants</span>
              </div>

              <h1>{activeEvent.name}</h1>
              <p className="sp-edesc">{activeEvent.description}</p>

              <div className="sp-emeta">
                <div className="sp-emeta-item">
                  <span className="sp-emeta-label">
                    {activeStatus === "ended"
                      ? "Status"
                      : activeStatus === "upcoming"
                        ? "Starts"
                        : "Time left"}
                  </span>
                  <span className="sp-emeta-value">
                    {activeStatus === "ended"
                      ? "Ended"
                      : activeStatus === "upcoming"
                        ? startsIn(activeEvent.startsAt - now).replace("Starts in ", "")
                        : timeLeft(activeEvent.endsAt - now).replace(" left", "")}
                  </span>
                </div>
                <div className="sp-emeta-item">
                  <span className="sp-emeta-label">Total votes</span>
                  <span className="sp-emeta-value">{count(activeTotal)}</span>
                </div>
                <div className="sp-emeta-item">
                  <span className="sp-emeta-label">Free votes</span>
                  <span className="sp-emeta-value">
                    {activeEvent.freeVotingEnabled
                      ? Math.max(
                          0,
                          activeEvent.freeVoteLimit -
                            (freeVotesUsed[activeEvent.id] || 0),
                        )
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {activeStatus === "ended" && (
              <div className="sp-banner closed">
                <Trophy size={16} />
                <div>
                  <strong>Voting closed</strong>
                  Results are final. Winner: {activeVotes[0] ? activeVotes[0].name : "—"}.
                </div>
              </div>
            )}

            {activeStatus === "upcoming" && (
              <div className="sp-banner">
                <CalendarClock size={16} />
                <div>
                  <strong>Voting hasn&apos;t started</strong>
                  {startsIn(activeEvent.startsAt - now)}. Set a reminder and we&apos;ll nudge you.
                </div>
                <button
                  type="button"
                  className="sp-btn"
                  style={{ marginLeft: "auto", flexShrink: 0 }}
                  aria-pressed={reminders.includes(activeEvent.id)}
                  onClick={() => toggleRemind(activeEvent)}
                >
                  {reminders.includes(activeEvent.id) ? "Reminder set" : "Remind me"}
                </button>
              </div>
            )}

            {activeEvent.votingDisabled && activeStatus !== "ended" && (
              <div className="sp-banner paused">
                <AlertCircle size={16} />
                <div>
                  <strong>Voting paused</strong>
                  The organiser paused voting. You can still browse the leaderboard.
                </div>
              </div>
            )}

            {lastVote && lastVote.eventId === activeEvent.id && (
              <div className="sp-voted">
                <div>
                  You voted for <strong>{lastVote.name}</strong>
                  {lastVote.quantity > 1 ? " (" + lastVote.quantity + " votes)" : ""}.
                </div>
                <button
                  type="button"
                  className="sp-btn"
                  style={{ minHeight: 40, padding: "0 14px", fontSize: 13 }}
                  onClick={() => shareEvent(activeEvent)}
                >
                  <Share2 size={13} /> Share
                </button>
              </div>
            )}

            <div className="sp-lb-head">
              <h2>{activeStatus === "ended" ? "Final ranking" : "Leaderboard"}</h2>
              <span className="sp-lb-note">
                {activeStatus === "ended" ? "Read-only" : "Votes update live"}
              </span>
            </div>

            <div className="sp-lb">
              {activeVotes.map((contestant, index) => {
                const canVote =
                  (activeStatus === "live" || activeStatus === "closing") &&
                  !activeEvent.votingDisabled;
                return (
                  <div
                    className={"sp-lbrow" + (index === 0 ? " lead" : "")}
                    key={contestant.id}
                  >
                    <span className="sp-rank">{index + 1}</span>
                    <span className="sp-av">{initials(contestant.name)}</span>
                    <div className="sp-lbinfo">
                      <div className="sp-lbname">
                        {contestant.name}
                        {index === 0 && <Crown size={12} aria-label="Current leader" />}
                      </div>
                      <div className="sp-lbcat">{contestant.category}</div>
                    </div>
                    <Sparkline data={contestant.trend} />
                    {contestant.delta !== 0 && (
                      <span className={"sp-delta " + (contestant.delta > 0 ? "up" : "down")}>
                        {contestant.delta > 0 ? "+" : "−"}
                        {Math.abs(contestant.delta)}
                        <span className="sr"> votes</span>
                      </span>
                    )}
                    <span className="sp-lbvotes">{count(contestant.votes)}</span>
                    {canVote && (
                      <button
                        type="button"
                        className="sp-btn primary"
                        onClick={() => openVote(activeEvent, contestant)}
                      >
                        Vote
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {(activeStatus === "live" || activeStatus === "closing") &&
            !activeEvent.votingDisabled &&
            activeVotes[0] && (
              <div className="sp-sticky">
                <div className="sp-wrap sp-sticky-in">
                  <div className="sp-sticky-text">
                    <strong>
                      {activeEvent.freeVotingEnabled
                        ? activeFreeLeft > 0
                          ? activeFreeLeft + " free " + (activeFreeLeft === 1 ? "vote" : "votes") + " left"
                          : "Free vote used"
                        : naira(activeEvent.paidVotePrice) + " per vote"}
                    </strong>
                    {activeEvent.freeVotingEnabled && activeFreeLeft > 0
                      ? "Free votes are counted first."
                      : activeEvent.paidVotingEnabled
                        ? "Buy more votes from " + naira(activeEvent.paidVotePrice) + "."
                        : "You've used your free vote for this event."}
                  </div>
                  <button
                    type="button"
                    className="sp-btn primary"
                    onClick={() => openVote(activeEvent, activeVotes[0])}
                    aria-label={"Vote for " + activeVotes[0].name}
                  >
                    Vote
                  </button>
                </div>
              </div>
            )}
        </div>
      )}

      {voteFlow && voteEvent && voteContestant && (
        <div className="sp-backdrop" onClick={() => setVoteFlow(null)}>
          <div
            className="sp-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sp-sheet-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sp-grab" />

            {voteFlow.step === "choose" && (
              <>
                <div className="sp-sheet-head">
                  <div>
                    <h2 id="sp-sheet-title">Vote for {voteContestant.name}</h2>
                    <p className="sp-sheet-body">
                      {voteContestant.category} · {count(voteContestant.votes)} votes
                    </p>
                  </div>
                  <button
                    type="button"
                    className="sp-close"
                    aria-label="Close vote options"
                    onClick={() => setVoteFlow(null)}
                  >
                    <X size={17} />
                  </button>
                </div>

                {voteEvent.freeVotingEnabled && (
                  <div className="sp-box">
                    <h3>Free vote</h3>
                    {freeLeft > 0 ? (
                      <>
                        <p>
                          Cast 1 free vote for this candidate. You have {freeLeft} free{" "}
                          {freeLeft === 1 ? "vote" : "votes"} left.
                        </p>
                        <button
                          type="button"
                          className="sp-btn primary block"
                          style={{ marginTop: 12 }}
                          onClick={() => castFree(voteEvent, voteContestant)}
                        >
                          Vote Free
                        </button>
                      </>
                    ) : (
                      <p>
                        You&apos;ve used your free {voteEvent.freeVoteLimit === 1 ? "vote" : "votes"} for
                        this event.
                      </p>
                    )}
                  </div>
                )}

                {voteEvent.paidVotingEnabled && (
                  <div className="sp-box">
                    <h3>Paid votes</h3>
                    <p>
                      {naira(voteEvent.paidVotePrice)} per vote. Paid votes stay locked to this
                      candidate.
                    </p>
                    <div className="sp-stepper">
                      <span style={{ fontSize: 13 }}>How many votes?</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button
                          type="button"
                          className="sp-stepbtn"
                          aria-label="Remove one vote"
                          disabled={voteFlow.qty <= 1}
                          onClick={() =>
                            setVoteFlow((flow) => ({
                              ...flow,
                              qty: Math.max(1, flow.qty - 1),
                            }))
                          }
                        >
                          <Minus size={16} />
                        </button>
                        <span className="sp-qty" aria-live="polite">{voteFlow.qty}</span>
                        <button
                          type="button"
                          className="sp-stepbtn"
                          aria-label="Add one vote"
                          onClick={() =>
                            setVoteFlow((flow) => ({ ...flow, qty: Math.min(99, flow.qty + 1) }))
                          }
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="sp-total">
                      <span>Total</span>
                      <b>{naira(voteEvent.paidVotePrice * voteFlow.qty)}</b>
                    </div>
                    <button
                      type="button"
                      className="sp-btn primary block"
                      onClick={() => startPayment()}
                    >
                      Continue to Payment
                    </button>
                  </div>
                )}

                {!voteEvent.freeVotingEnabled && !voteEvent.paidVotingEnabled && (
                  <div className="sp-box">
                    <p>Voting is closed for this event.</p>
                  </div>
                )}
              </>
            )}

            {voteFlow.step === "confirm" && (
              <>
                <div className="sp-sheet-head">
                  <div>
                    <h2 id="sp-sheet-title">Confirm payment</h2>
                    <p className="sp-sheet-body">Check the total before you pay.</p>
                  </div>
                  <button
                    type="button"
                    className="sp-close"
                    aria-label="Close payment"
                    onClick={() => setVoteFlow(null)}
                  >
                    <X size={17} />
                  </button>
                </div>
                <div className="sp-box">
                  <div className="sp-payline">
                    <span>
                      {voteFlow.qty} {voteFlow.qty === 1 ? "vote" : "votes"} ×{" "}
                      {naira(voteEvent.paidVotePrice)}
                    </span>
                    <b>{naira(voteEvent.paidVotePrice * voteFlow.qty)}</b>
                  </div>
                  <div className="sp-payline">
                    <span>Total</span>
                    <b>{naira(voteEvent.paidVotePrice * voteFlow.qty)}</b>
                  </div>
                </div>
                <div className="sp-note">
                  <ShieldCheck size={14} />
                  You&apos;ll receive {voteFlow.qty} paid{" "}
                  {voteFlow.qty === 1 ? "vote" : "votes"} for {voteContestant.name} after payment.
                  They stay locked to this candidate.
                </div>
                <div className="sp-sheet-actions">
                  <button
                    type="button"
                    className="sp-btn"
                    onClick={() => setVoteFlow((flow) => ({ ...flow, step: "choose" }))}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="sp-btn primary"
                    onClick={() => setVoteFlow((flow) => ({ ...flow, step: "success" }))}
                  >
                    Pay {naira(voteEvent.paidVotePrice * voteFlow.qty)}
                  </button>
                </div>
              </>
            )}

            {voteFlow.step === "success" && (
              <div className="sp-success">
                <div className="sp-success-ic">
                  <Check size={26} />
                </div>
                <h2 id="sp-sheet-title">Payment successful</h2>
                <p>
                  You bought {voteFlow.qty} {voteFlow.qty === 1 ? "vote" : "votes"} for{" "}
                  {voteContestant.name}.
                </p>
                <button
                  type="button"
                  className="sp-btn primary block"
                  onClick={() => castPaid(voteEvent, voteContestant)}
                >
                  Cast {voteFlow.qty} {voteFlow.qty === 1 ? "Vote" : "Votes"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {authOpen && (
        <div className="sp-backdrop" onClick={closeAuth}>
          <div
            className="sp-sheet sp-auth"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sp-auth-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sp-grab" />
            <div className="sp-sheet-head">
              <div>
                <div className="sp-auth-ic">
                  <User size={20} />
                </div>
                <h2 id="sp-auth-title">
                  {authMode === "signin" ? "Sign in to vote" : "Create your account"}
                </h2>
                <p className="sp-sheet-body" style={{ marginTop: 4 }}>
                  {authMode === "signup"
                    ? "One free vote per event, plus paid votes when you want more. It takes a second."
                    : "We only ask when it's time to count your vote. Sign in and we'll pick up right where you left off."}
                </p>
              </div>
              <button type="button" className="sp-close" aria-label="Close sign in" onClick={closeAuth}>
                <X size={17} />
              </button>
            </div>

            <form className="sp-auth-form" onSubmit={submitAuth} noValidate>
              {authMode === "signup" && (
                <div className="sp-field">
                  <label htmlFor="sp-auth-name">Your name</label>
                  <div className="sp-field-in">
                    <User size={15} aria-hidden="true" />
                    <input
                      id="sp-auth-name"
                      type="text"
                      value={authForm.name}
                      onChange={updateAuthField("name")}
                      placeholder="Ada Obi"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              <div className="sp-field">
                <label htmlFor="sp-auth-email">Email</label>
                <div className="sp-field-in">
                  <Mail size={15} aria-hidden="true" />
                  <input
                    id="sp-auth-email"
                    type="email"
                    value={authForm.email}
                    onChange={updateAuthField("email")}
                    placeholder="ada@example.com"
                    autoComplete="email"
                    aria-invalid={Boolean(authError)}
                    aria-describedby={authError ? "sp-auth-error" : undefined}
                  />
                </div>
              </div>

              <div className="sp-field">
                <label htmlFor="sp-auth-password">Password</label>
                <div className="sp-field-in">
                  <Lock size={15} aria-hidden="true" />
                  <input
                    id="sp-auth-password"
                    type={showPass ? "text" : "password"}
                    value={authForm.password}
                    onChange={updateAuthField("password")}
                    placeholder="At least 8 characters"
                    autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                    aria-invalid={Boolean(authError)}
                    aria-describedby={authError ? "sp-auth-error" : undefined}
                  />
                  <button
                    type="button"
                    className="sp-reveal"
                    aria-label={showPass ? "Hide password" : "Show password"}
                    onClick={() => setShowPass((value) => !value)}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {authError && (
                <p className="sp-auth-error" id="sp-auth-error" role="alert">
                  <AlertCircle size={13} aria-hidden="true" /> {authError}
                </p>
              )}

              {authMode === "signin" && (
                <p className="sp-auth-hint">
                  Demo login: <b>alex@example.com</b> · <b>stagepick123</b>
                </p>
              )}

              <button type="submit" className="sp-btn primary block">
                {authMode === "signin" ? "Sign in and continue" : "Create account and continue"}
                <ArrowRight size={15} aria-hidden="true" />
              </button>

              <p className="sp-auth-switch">
                {authMode === "signin" ? "New here?" : "Already have an account?"}{" "}
                <button type="button" onClick={switchAuthMode}>
                  {authMode === "signin" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </form>

            <button type="button" className="sp-btn block" onClick={closeAuth}>
              Not now
            </button>
          </div>
        </div>
      )}


      <div className="sr" aria-live="polite">{announcement}</div>
      {toast && (
        <div className="sp-toast" role="status">
          <Check size={15} aria-hidden="true" /> {toast}
        </div>
      )}
      </div>
    </>
  );
}



