import { useEffect, useRef, useState } from "react";
import {
  Menu, X, ArrowLeft, Check, Plus, User, Users2, Settings as SettingsIcon,
  BarChart3, Download, Trash2, Eye, Pencil, TrendingUp, TrendingDown, Crown,
  PartyPopper, LogOut, History, MoreVertical, ChevronDown, ChevronLeft,
  ChevronRight, ImagePlus, Link2, Copy,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import "./dashboard.css";

function initials(name) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function Sparkline({ data, color = "#3B5BF5" }) {
  if (!data || data.length < 2) return <div style={{ width: 52, height: 22 }} />;
  const w = 52, h = 22;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="voter-sparkline">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeltaBadge({ delta }) {
  if (!delta) return null;
  const up = delta > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`org-delta ${up ? "up" : "down"}`}>
      <Icon size={10} /> {up ? "+" : ""}{delta}
    </span>
  );
}

function ShareLink({ url, onCopy, label, desc, className = "" }) {
  return (
    <div className={`org-share${className ? ` ${className}` : ""}`}>
      <div>
        <div className="org-setting-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Link2 size={13} /> {label}
        </div>
        <div className="org-setting-desc">{desc}</div>
      </div>
      <div className="org-share-control">
        <input
          type="text"
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          aria-label="Event share link"
        />
        <button type="button" className="app-btn small" onClick={onCopy}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Copy size={12} /> Copy</span>
        </button>
      </div>
    </div>
  );
}

function seedHistory(list) {
  const out = {};
  list.forEach((c) => {
    const steps = [0.72, 0.8, 0.86, 0.91, 0.96, 1];
    out[c.id] = steps.map((f) => Math.round(c.votes * f));
  });
  return out;
}

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

// Short date for event meta ("7 Nov"). Returns "" for empty/invalid input.
function formatEventDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

// ---------------------------------------------------------------------------
// Demo data. Each event owns its own contestants, voting rules and visibility,
// so switching events in the dashboard genuinely swaps the whole contest.
// ---------------------------------------------------------------------------
const seedEvents = [
  {
    id: "ev-talent",
    name: "Campus Talent Night 2026",
    description: "Five finalists, one crown. Voting closes at midnight — every vote counts.",
    accent: "#C98CF0",
    cover: null,
    startsAt: "2026-11-07T18:00",
    endsAt: "2026-11-07T23:59",
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 1,
    paidVotingEnabled: true,
    paidVotePrice: 100,
    contestants: [
      { id: "t1", name: "Amara Okafor", category: "Music", votes: 842, status: "active", paid: true },
      { id: "t2", name: "Tolu Adeyemi", category: "Dance", votes: 913, status: "active", paid: true },
      { id: "t3", name: "Ngozi Eze", category: "Spoken word", votes: 654, status: "active", paid: false },
      { id: "t4", name: "Ibrahim Sule", category: "Comedy", votes: 1204, status: "active", paid: true },
      { id: "t5", name: "Chidera Nwosu", category: "Music", votes: 431, status: "eliminated", paid: true },
    ],
  },
  {
    id: "ev-missfresher",
    name: "Miss Fresher 2026",
    description: "The freshers' showcase. Free votes reset daily, paid votes support your faculty.",
    accent: "#FF8FA3",
    cover: null,
    startsAt: "2026-11-02T17:00",
    endsAt: "2026-11-02T22:00",
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 2,
    paidVotingEnabled: true,
    paidVotePrice: 50,
    contestants: [
      { id: "mf1", name: "Bella Babalola", category: "Arts", votes: 1250, status: "active", paid: true },
      { id: "mf2", name: "Emanuella Adinye", category: "Sciences", votes: 1124, status: "active", paid: true },
      { id: "mf3", name: "Peace Chituga", category: "Law", votes: 987, status: "active", paid: false },
      { id: "mf4", name: "Zainab Bello", category: "Engineering", votes: 1432, status: "active", paid: true },
      { id: "mf5", name: "Grace Etuk", category: "Medicine", votes: 761, status: "active", paid: true },
      { id: "mf6", name: "Halima Yusuf", category: "Arts", votes: 508, status: "eliminated", paid: false },
    ],
  },
  {
    id: "ev-dj",
    name: "Battle of the DJs",
    description: "Four DJs, two decks, one winner. Unlisted — share the link to let people vote.",
    accent: "#8FB8FF",
    cover: null,
    startsAt: "2026-11-14T20:00",
    endsAt: "2026-11-15T02:00",
    visibility: "unlisted",
    freeVotingEnabled: false,
    freeVoteLimit: 0,
    paidVotingEnabled: true,
    paidVotePrice: 200,
    contestants: [
      { id: "dj1", name: "DJ Kryptic", category: "Afrobeats", votes: 2044, status: "active", paid: true },
      { id: "dj2", name: "DJ Nova", category: "Amapiano", votes: 1876, status: "active", paid: true },
      { id: "dj3", name: "DJ Static", category: "Hip hop", votes: 1320, status: "active", paid: true },
      { id: "dj4", name: "DJ Blaze", category: "House", votes: 908, status: "active", paid: false },
    ],
  },
  {
    id: "ev-hack",
    name: "Hackathon Demo Day",
    description: "Seven teams pitch what they built in 36 hours. Free voting for everyone.",
    accent: "#7DE8A8",
    cover: null,
    startsAt: "2026-11-20T10:00",
    endsAt: "2026-11-20T16:00",
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 3,
    paidVotingEnabled: false,
    paidVotePrice: 0,
    contestants: [
      { id: "h1", name: "Team Bytewise", category: "Fintech", votes: 322, status: "active", paid: false },
      { id: "h2", name: "Team Loop", category: "Health", votes: 287, status: "active", paid: false },
      { id: "h3", name: "Team Kernel", category: "Developer tools", votes: 265, status: "active", paid: false },
      { id: "h4", name: "Team Lambda", category: "Education", votes: 198, status: "active", paid: false },
      { id: "h5", name: "Team Vector", category: "Logistics", votes: 176, status: "active", paid: false },
      { id: "h6", name: "Team Pulse", category: "Agritech", votes: 154, status: "active", paid: false },
      { id: "h7", name: "Team Quanta", category: "Climate", votes: 121, status: "eliminated", paid: false },
    ],
  },
  {
    id: "ev-food",
    name: "Best Campus Food Spot",
    description: "Eight vendors, one title. Vote for the spot that never disappoints.",
    accent: "#FFA46B",
    cover: null,
    startsAt: "2026-10-28T09:00",
    endsAt: "2026-10-31T21:00",
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 1,
    paidVotingEnabled: true,
    paidVotePrice: 30,
    contestants: [
      { id: "f1", name: "Mama Nkechi's Kitchen", category: "Local dishes", votes: 986, status: "active", paid: true },
      { id: "f2", name: "Grill Republic", category: "Barbecue", votes: 902, status: "active", paid: true },
      { id: "f3", name: "The Smoothie Bar", category: "Drinks", votes: 744, status: "active", paid: false },
      { id: "f4", name: "Shawarma Corner", category: "Fast food", votes: 688, status: "active", paid: true },
      { id: "f5", name: "Bread & Butter", category: "Bakery", votes: 512, status: "active", paid: false },
      { id: "f6", name: "Jollof HQ", category: "Local dishes", votes: 467, status: "active", paid: true },
      { id: "f7", name: "Noodle House", category: "Asian", votes: 389, status: "active", paid: false },
      { id: "f8", name: "Campus Café", category: "Coffee", votes: 214, status: "eliminated", paid: false },
    ],
  },
  {
    id: "ev-gospel",
    name: "Gospel Music Awards",
    description: "Celebrating the voices that carry the campus choir. Paid votes fund the prize pool.",
    accent: "#B49BFF",
    cover: null,
    startsAt: "2026-12-05T18:00",
    endsAt: "2026-12-05T22:30",
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 1,
    paidVotingEnabled: true,
    paidVotePrice: 150,
    contestants: [
      { id: "g1", name: "Praise Adeyinka", category: "Contemporary", votes: 1780, status: "active", paid: true },
      { id: "g2", name: "The Covenant Choir", category: "Choral", votes: 1655, status: "active", paid: true },
      { id: "g3", name: "Samuel Iheanacho", category: "Traditional", votes: 1210, status: "active", paid: true },
      { id: "g4", name: "Deborah Anjola", category: "Contemporary", votes: 940, status: "active", paid: false },
      { id: "g5", name: "Voices of Zion", category: "Choral", votes: 623, status: "active", paid: true },
    ],
  },
  {
    id: "ev-debate",
    name: "Inter-Faculty Debate",
    description: "Six faculties, one motion. Free voting, no paywall — arguments only.",
    accent: "#6FD6C6",
    cover: null,
    startsAt: "2026-11-11T14:00",
    endsAt: "2026-11-11T18:00",
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 5,
    paidVotingEnabled: false,
    paidVotePrice: 0,
    contestants: [
      { id: "d1", name: "Faculty of Law", category: "Law", votes: 640, status: "active", paid: false },
      { id: "d2", name: "Faculty of Arts", category: "Arts", votes: 588, status: "active", paid: false },
      { id: "d3", name: "Faculty of Sciences", category: "Sciences", votes: 534, status: "active", paid: false },
      { id: "d4", name: "Faculty of Engineering", category: "Engineering", votes: 502, status: "active", paid: false },
      { id: "d5", name: "Faculty of Social Sciences", category: "Social sciences", votes: 441, status: "active", paid: false },
      { id: "d6", name: "Faculty of Medicine", category: "Medicine", votes: 388, status: "eliminated", paid: false },
    ],
  },
  {
    id: "ev-afro",
    name: "Afrobeats Dance-Off",
    description: "Four crews, one floor. Voting stays open until the last song ends.",
    accent: "#F7C569",
    cover: null,
    startsAt: "2026-11-28T19:00",
    endsAt: "2026-11-28T23:00",
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 1,
    paidVotingEnabled: true,
    paidVotePrice: 75,
    contestants: [
      { id: "a1", name: "Crew Inferno", category: "Afrobeats", votes: 1490, status: "active", paid: true },
      { id: "a2", name: "The MoveMakers", category: "Amapiano", votes: 1388, status: "active", paid: true },
      { id: "a3", name: "Street Kings", category: "Hip hop", votes: 1102, status: "active", paid: false },
      { id: "a4", name: "Neon Squad", category: "Afrobeats", votes: 876, status: "active", paid: true },
    ],
  },
  {
    id: "ev-pitch",
    name: "Startup Pitch Night",
    description: "Six founders, five minutes each. Unlisted — open to invited guests only.",
    accent: "#8FB8FF",
    cover: null,
    startsAt: "2026-12-12T17:30",
    endsAt: "2026-12-12T21:00",
    visibility: "unlisted",
    freeVotingEnabled: true,
    freeVoteLimit: 2,
    paidVotingEnabled: false,
    paidVotePrice: 0,
    contestants: [
      { id: "p1", name: "Kola Adebayo", category: "Fintech", votes: 412, status: "active", paid: false },
      { id: "p2", name: "Ifeoma Obi", category: "Health tech", votes: 388, status: "active", paid: false },
      { id: "p3", name: "Musa Danjuma", category: "Logistics", votes: 340, status: "active", paid: false },
      { id: "p4", name: "Ruth Osei", category: "Edtech", votes: 301, status: "active", paid: false },
      { id: "p5", name: "Emeka Nnamdi", category: "Agritech", votes: 276, status: "active", paid: false },
      { id: "p6", name: "Fatima Sani", category: "Climate", votes: 199, status: "active", paid: false },
    ],
  },
  {
    id: "ev-photo",
    name: "Photography Challenge",
    description: "Nine photographers, one theme: 'Motion'. Vote for the shot that stopped you.",
    accent: "#FF8FA3",
    cover: null,
    startsAt: "2026-11-05T08:00",
    endsAt: "2026-11-09T20:00",
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 1,
    paidVotingEnabled: true,
    paidVotePrice: 40,
    contestants: [
      { id: "ph1", name: "Ada Chukwu", category: "Street", votes: 733, status: "active", paid: true },
      { id: "ph2", name: "Bode Ajayi", category: "Portrait", votes: 702, status: "active", paid: true },
      { id: "ph3", name: "Chiamaka Umeh", category: "Documentary", votes: 655, status: "active", paid: false },
      { id: "ph4", name: "Dayo Fashola", category: "Landscape", votes: 601, status: "active", paid: true },
      { id: "ph5", name: "Ese Igho", category: "Street", votes: 548, status: "active", paid: false },
      { id: "ph6", name: "Femi Ade", category: "Portrait", votes: 470, status: "active", paid: true },
      { id: "ph7", name: "Gloria Nnaji", category: "Abstract", votes: 388, status: "active", paid: false },
      { id: "ph8", name: "Hassan Bala", category: "Landscape", votes: 322, status: "active", paid: false },
      { id: "ph9", name: "Ijeoma Eze", category: "Documentary", votes: 244, status: "eliminated", paid: false },
    ],
  },
  {
    id: "ev-independence",
    name: "Mr & Miss Independence",
    description: "Eight finalists representing their states. Paid votes go to the charity partner.",
    accent: "#C98CF0",
    cover: null,
    startsAt: "2026-10-01T17:00",
    endsAt: "2026-10-01T23:00",
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 1,
    paidVotingEnabled: true,
    paidVotePrice: 120,
    contestants: [
      { id: "i1", name: "Chinedu Obi", category: "Enugu", votes: 2104, status: "active", paid: true },
      { id: "i2", name: "Aisha Mohammed", category: "Kano", votes: 1988, status: "active", paid: true },
      { id: "i3", name: "Tunde Bakare", category: "Lagos", votes: 1776, status: "active", paid: true },
      { id: "i4", name: "Ngozi Uche", category: "Anambra", votes: 1502, status: "active", paid: false },
      { id: "i5", name: "Bassey Okon", category: "Akwa Ibom", votes: 1344, status: "active", paid: true },
      { id: "i6", name: "Fatima Bello", category: "Kaduna", votes: 1188, status: "active", paid: false },
      { id: "i7", name: "Segun Ade", category: "Oyo", votes: 902, status: "active", paid: true },
      { id: "i8", name: "Yemi Alade", category: "Ekiti", votes: 455, status: "eliminated", paid: false },
    ],
  },
  {
    id: "ev-comedy",
    name: "Stand-up Comedy Slam",
    description: "Five comics, no warm-up. Laugh, then vote — free votes close first.",
    accent: "#FFA46B",
    cover: null,
    startsAt: "2026-12-19T20:00",
    endsAt: "2026-12-19T23:30",
    visibility: "public",
    freeVotingEnabled: true,
    freeVoteLimit: 1,
    paidVotingEnabled: true,
    paidVotePrice: 60,
    contestants: [
      { id: "co1", name: "Kenny Blaq", category: "Stand-up", votes: 1120, status: "active", paid: true },
      { id: "co2", name: "Tee Ali", category: "Sketch", votes: 1044, status: "active", paid: true },
      { id: "co3", name: "MC Lively", category: "Stand-up", votes: 988, status: "active", paid: false },
      { id: "co4", name: "Josh2Funny", category: "Sketch", votes: 812, status: "active", paid: true },
      { id: "co5", name: "Nasty Blaq", category: "Stand-up", votes: 603, status: "active", paid: false },
    ],
  },
];

const allSeedContestants = seedEvents.flatMap((e) => e.contestants);

const WIZARD_STEPS = ["Basics", "Visibility", "Voting", "Contestants"];

let uidSeq = 0;
const uid = (prefix) => `${prefix}-${++uidSeq}`;

const slugify = (value) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "event";

const shareUrlFor = (name) => `${window.location.origin}/e/${slugify(name)}`;

const blankDraft = () => ({
  name: "",
  description: "",
  cover: null,
  startsAt: "",
  endsAt: "",
  visibility: "public",
  freeVotingEnabled: true,
  freeVoteLimit: 1,
  paidVotingEnabled: true,
  paidVotePrice: 50,
  rows: [{ key: uid("row"), name: "", category: "", paid: false }],
});


const trendData = [
  { t: "6pm", c1: 400, c2: 350, c3: 300 },
  { t: "7pm", c1: 600, c2: 540, c3: 480 },
  { t: "8pm", c1: 820, c2: 760, c3: 660 },
  { t: "9pm", c1: 1010, c2: 920, c3: 800 },
  { t: "10pm", c1: 1160, c2: 1040, c3: 910 },
  { t: "11pm", c1: 1250, c2: 1124, c3: 987 },
];

const audienceTrend = [
  { t: "6pm", voters: 120 }, { t: "7pm", voters: 340 }, { t: "8pm", voters: 720 },
  { t: "9pm", voters: 1180 }, { t: "10pm", voters: 1680 }, { t: "11pm", voters: 2104 },
];

export default function StagePickApp({ onOpenHome = null }) {
  const [mode, setMode] = useState(() => new URLSearchParams(window.location.search).get("mode") || "voter"); // "voter" | "organizer"
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [toastCelebration, setToastCelebration] = useState(false);
  const [activityLog, setActivityLog] = useState([]);

  // Each event owns its contestants, voting rules and visibility.
  const [events, setEvents] = useState(seedEvents);
  const [eventIndex, setEventIndex] = useState(0);
  const activeEvent = events[eventIndex] ?? events[0];
  const activeEventId = activeEvent.id;
  const contestants = activeEvent.contestants;

  // Create-event wizard
  const [wizardOpen, setWizardOpen] = useState(
    () => new URLSearchParams(window.location.search).get("wizard") === "1",
  );
  const [wizardStep, setWizardStep] = useState(0);
  const [draft, setDraft] = useState(blankDraft);
  const coverInputRef = useRef(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [currentUser, setCurrentUser] = useState({
    name: "Alex Morgan",
    username: "alex_m",
    email: "alex@example.com",
    memberSince: "Jul 2026",
    eventsParticipated: ["Untitled Event"],
    totalVotesCastAllTime: 7,
  });
  const [pastVotes] = useState([
    { contestant: "Bella Babalola", category: "Miss Fresher 2026 · Arts", date: "3 days ago" },
    { contestant: "DJ Nova", category: "Battle of the DJs · Amapiano", date: "Last week" },
    { contestant: "Team Bytewise", category: "Hackathon Demo Day · Fintech", date: "12 Oct 2026" },
  ]);

  const [orgTab, setOrgTab] = useState("leaderboard"); // "leaderboard" | "trend"
  const [orgSection, setOrgSection] = useState(() => new URLSearchParams(window.location.search).get("section") || "overview");

  const [addContestantOpen, setAddContestantOpen] = useState(false);
  const [newContestant, setNewContestant] = useState({ name: "", category: "", paid: false });
  const [openContestantMenu, setOpenContestantMenu] = useState(null);

  const [teamMembers, setTeamMembers] = useState([
    { name: "You", email: "you@example.com", role: "Owner" },
  ]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteDraft, setInviteDraft] = useState({ email: "", role: "Viewer" });
  const [openTeamMenu, setOpenTeamMenu] = useState(null);

  const [freeVotesUsed, setFreeVotesUsed] = useState({}); // { [eventId]: count }
  const [myVotes, setMyVotes] = useState([]); // {id, eventId, eventName, contestantId, name, category, type, quantity, price, at}
  const [voteFlow, setVoteFlow] = useState(null); // {contestant, step: 'choose'|'payment'|'success', quantity}

  const [voteHistory, setVoteHistory] = useState(() => seedHistory(allSeedContestants));
  const [deltas, setDeltas] = useState({});
  const prevVotesRef = useRef({}); // { [eventId]: { [contestantId]: votes } }
  const leaderRef = useRef({}); // { [eventId]: leaderId }

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => {
      setToast(null);
      setToastCelebration(false);
    }, 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const ranked = [...contestants].sort((a, b) => b.votes - a.votes);
  const totalVotes = contestants.reduce((s, c) => s + c.votes, 0);
  const myVotesForEvent = myVotes.filter((v) => v.eventId === activeEventId);
  const freeVotesUsedCount = freeVotesUsed[activeEventId] || 0;
  const shareUrl = shareUrlFor(activeEvent.name);

  // --- Every mutation below writes to the active event only ---
  const setContestants = (updater) =>
    setEvents((prev) =>
      prev.map((ev, i) =>
        i === eventIndex
          ? { ...ev, contestants: typeof updater === "function" ? updater(ev.contestants) : updater }
          : ev,
      ),
    );

  const patchEvent = (patch) =>
    setEvents((prev) => prev.map((ev, i) => (i === eventIndex ? { ...ev, ...patch } : ev)));

  const updateDraftRow = (key, patch) =>
    setDraft((d) => ({ ...d, rows: d.rows.map((r) => (r.key === key ? { ...r, ...patch } : r)) }));
  const addDraftRow = () =>
    setDraft((d) => ({ ...d, rows: [...d.rows, { key: uid("row"), name: "", category: "", paid: false }] }));
  const removeDraftRow = (key) =>
    setDraft((d) => ({ ...d, rows: d.rows.filter((r) => r.key !== key) }));

  const openWizard = () => {
    setDraft(blankDraft());
    setWizardStep(0);
    setWizardOpen(true);
  };

  const showToast = (message, celebration = false) => {
    setToast(message);
    setToastCelebration(celebration);
  };

  const logActivity = (type, description) => {
    setActivityLog((prev) => [
      { id: `${Date.now()}-${Math.random()}`, type, description, time: nowLabel() },
      ...prev,
    ].slice(0, 14));
  };

  const handleSignOut = () => {
    setMenuOpen(false);
    setProfileOpen(false);
    showToast("Signed out");
  };

  const freeVotesRemaining = Math.max(0, (activeEvent.freeVoteLimit || 0) - freeVotesUsedCount);

  const openVoteFlow = (c) => setVoteFlow({ contestant: c, step: "choose", quantity: 1 });

  const recordVote = (contestant, type, quantity) => {
    setMyVotes((prev) => [
      {
        id: uid("vote"),
        eventId: activeEventId,
        eventName: activeEvent.name,
        contestantId: contestant.id,
        name: contestant.name,
        category: contestant.category,
        type,
        quantity,
        price: type === "paid" ? activeEvent.paidVotePrice : 0,
        at: Date.now(),
      },
      ...prev,
    ]);
  };

  const castFreeVote = (contestant) => {
    if (freeVotesRemaining <= 0) return;
    setContestants((prev) => prev.map((c) => (c.id === contestant.id ? { ...c, votes: c.votes + 1 } : c)));
    setFreeVotesUsed((m) => ({ ...m, [activeEventId]: (m[activeEventId] || 0) + 1 }));
    recordVote(contestant, "free", 1);
    setVoteFlow(null);
  };

  const castPaidVotes = () => {
    const { contestant, quantity } = voteFlow;
    setContestants((prev) => prev.map((c) => (c.id === contestant.id ? { ...c, votes: c.votes + quantity } : c)));
    recordVote(contestant, "paid", quantity);
    setVoteFlow(null);
  };

  const copyText = async (text, okMessage) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard api");
      await navigator.clipboard.writeText(text);
      showToast(okMessage);
    } catch {
      // Older/insecure contexts: fall back to a throwaway selection.
      const field = document.createElement("textarea");
      field.value = text;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      try {
        document.execCommand("copy");
        showToast(okMessage);
      } catch {
        showToast("Couldn't copy — select the link and copy it manually");
      }
      document.body.removeChild(field);
    }
  };

  const handleCoverFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // let the same file be re-picked later
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("That file isn't an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Cover images need to be under 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, cover: String(reader.result) }));
    reader.onerror = () => showToast("Couldn't read that image");
    reader.readAsDataURL(file);
  };

  const createEvent = () => {
    const name = draft.name.trim() || `New event ${events.length + 1}`;
    const { rows, ...fields } = draft;
    const list = rows
      .filter((r) => r.name.trim())
      .map((r) => ({
        id: uid("c"),
        name: r.name.trim(),
        category: r.category.trim() || "General",
        votes: 0,
        status: "active",
        paid: !!r.paid,
      }));
    const event = { ...fields, id: uid("ev"), name, contestants: list };
    setEvents((prev) => [...prev, event]);
    setEventIndex(events.length);
    setWizardOpen(false);
    setWizardStep(0);
    setDraft(blankDraft());
    showToast(
      event.visibility === "unlisted"
        ? "Event created — its link is in Settings"
        : "Event created",
    );
    logActivity("Event created", `${name} was created.`);
  };

  // Momentum: deltas, sparkline history, milestone/lead-change celebrations,
  // and the structured activity feed entries. Tracked per event so switching
  // events doesn't look like a lead change.
  useEffect(() => {
    const prevMap = prevVotesRef.current[activeEventId];

    if (!prevMap) {
      const seed = {};
      contestants.forEach((c) => { seed[c.id] = c.votes; });
      prevVotesRef.current[activeEventId] = seed;
      leaderRef.current[activeEventId] = ranked[0]?.id ?? null;
      return;
    }

    const nextPrev = { ...prevMap };
    const newDeltas = {};
    let celebrationMsg = null;
    let votedContestant = null;

    contestants.forEach((c) => {
      const prev = prevMap[c.id];
      if (prev === undefined) {
        nextPrev[c.id] = c.votes;
        return;
      }
      const delta = c.votes - prev;
      if (delta !== 0) newDeltas[c.id] = delta;
      if (delta > 0) {
        votedContestant = c;
        const prevMilestone = Math.floor(prev / 50);
        const newMilestone = Math.floor(c.votes / 50);
        if (newMilestone > prevMilestone && newMilestone > 0 && !celebrationMsg) {
          celebrationMsg = { kind: "milestone", text: `🎉 ${c.name} just crossed ${newMilestone * 50} votes!` };
        }
      }
      nextPrev[c.id] = c.votes;
    });

    prevVotesRef.current[activeEventId] = nextPrev;

    // Only grow the sparkline series when votes actually moved — switching
    // events or toggling a contestant shouldn't add a flat point.
    if (Object.keys(newDeltas).length > 0) {
      setVoteHistory((prevHist) => {
        const next = { ...prevHist };
        contestants.forEach((c) => {
          const arr = next[c.id] ? [...next[c.id]] : [];
          arr.push(c.votes);
          next[c.id] = arr.slice(-8);
        });
        return next;
      });
      setDeltas(newDeltas);
    }

    const newLeader = ranked[0]?.id ?? null;
    const leaderChanged = newLeader && newLeader !== leaderRef.current[activeEventId];
    if (leaderChanged && !celebrationMsg) {
      const leaderName = contestants.find((c) => c.id === newLeader)?.name;
      celebrationMsg = { kind: "lead", text: `🎉 ${leaderName} just took the lead!` };
    }

    if (celebrationMsg) {
      showToast(celebrationMsg.text, true);
      if (celebrationMsg.kind === "lead") {
        const leaderName = contestants.find((c) => c.id === newLeader)?.name;
        logActivity("Lead changed", `${leaderName} moved into 1st place.`);
      } else if (votedContestant) {
        logActivity("Milestone", `${votedContestant.name} crossed ${Math.floor(votedContestant.votes / 50) * 50} votes.`);
      }
    } else if (votedContestant) {
      showToast(`✓ Your vote for ${votedContestant.name} was counted.`, false);
      logActivity("New vote", `A voter supported ${votedContestant.name}.`);
    }

    leaderRef.current[activeEventId] = newLeader;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contestants, activeEventId]);

  // Keep the URL in step with the visible mode so a refresh lands in the same
  // place, and so the voter home can link straight to the organiser view.
  const syncMode = (next, wizard = false) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("view", "voter");
      url.searchParams.set("mode", next);
      if (wizard) url.searchParams.set("wizard", "1");
      else url.searchParams.delete("wizard");
      window.history.replaceState(null, "", url.toString());
    } catch {
      /* History can be blocked; the in-memory mode is enough. */
    }
  };

  const goOrganizer = () => {
    setMode("organizer");
    syncMode("organizer");
    setMenuOpen(false);
  };
  const goVoter = () => {
    if (onOpenHome) {
      onOpenHome();
      return;
    }
    setMode("voter");
    syncMode("voter");
  };

  const toggleEliminate = (id) => {
    setContestants((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: c.status === "eliminated" ? "active" : "eliminated" } : c))
    );
    setOpenContestantMenu(null);
  };

  const exportCSV = () => {
    const header = "name,category,votes,status,paid\n";
    const rows = contestants.map((c) => `"${c.name}","${c.category}",${c.votes},${c.status},${c.paid}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeEvent.name || "stagepick"}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Results exported");
    logActivity("Export", "Results were exported to CSV.");
  };

  const removeTeamMember = (email) => {
    setTeamMembers((prev) => prev.filter((m) => m.email !== email));
    setOpenTeamMenu(null);
  };

  return (
    <div className="app-root">
      <div className="app-topbar">
        <div>
          <div className="app-logo">Stage<span>Pick</span></div>
          <div className="app-event-id">STAGEPICK · {activeEvent.name.toUpperCase()}</div>
        </div>
        <div>
          {mode === "voter" ? (
            <button className="app-icon-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          ) : (
            <div style={{ width: 38 }} />
          )}
        </div>

        {menuOpen && mode === "voter" && (
          <div className="app-menu">
            <button className="app-menu-item" onClick={() => { setProfileOpen(true); setMenuOpen(false); }}>
              <User size={15} /> My profile
            </button>
            <div className="app-menu-divider"></div>
            <button className="app-menu-item" onClick={goOrganizer}>
              <BarChart3 size={15} /> Organiser dashboard
            </button>
            <div className="app-menu-divider"></div>
            <button
              className="app-menu-item"
              onClick={() => { setMode("organizer"); syncMode("organizer", true); openWizard(); setMenuOpen(false); }}
            >
              <Plus size={15} /> Create an event
            </button>
            <div className="app-menu-divider"></div>
            <button className="app-menu-item" onClick={handleSignOut}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </div>

      {mode === "voter" ? (
        <>
          <div className="voter-layout">
          <div className="voter-rail-wrap">
            <div className="app-wrap">
              <div className="voter-rail-head">
                <span className="voter-rail-title">Live events</span>
                <span className="voter-rail-count">{events.length} open</span>
              </div>

              <div className="voter-rail" role="tablist" aria-label="Events">
                {events.map((ev, i) => {
                  const evTotal = ev.contestants.reduce((sum, c) => sum + c.votes, 0);

                  return (
                    <button
                      type="button"
                      key={ev.id}
                      role="tab"
                      aria-selected={i === eventIndex}
                      className={`voter-chip${i === eventIndex ? " active" : ""}`}
                      onClick={() => setEventIndex(i)}
                    >
                      <span
                        className="voter-chip-thumb"
                        style={{ background: ev.accent || "#3B5BF5" }}
                      >
                        {initials(ev.name)}
                      </span>
                      <span className="voter-chip-body">
                        <span className="voter-chip-name">{ev.name}</span>
                        <span className="voter-chip-meta">
                          {ev.contestants.length} contestants · {evTotal.toLocaleString()} votes
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="voter-main">
          <div className="voter-hero">
            <div
              className="voter-hero-glow"
              aria-hidden="true"
              style={{
                background: `radial-gradient(ellipse 640px 320px at 10% 0%, ${activeEvent.accent || "#3B5BF5"}33, transparent 70%)`,
              }}
            />
            <div className="app-wrap voter-hero-inner">
              <div className="voter-hero-copy">
                <div className="voter-hero-tags">
                  <span className="voter-badge"><span className="voter-dot"></span>Live</span>
                  <span className="voter-tag-pill">
                    {activeEvent.visibility === "unlisted" ? "Unlisted" : "Public"}
                  </span>
                  <span className="voter-tag-pill">{contestants.length} contestants</span>
                  {formatEventDate(activeEvent.startsAt) && (
                    <span className="voter-tag-pill">{formatEventDate(activeEvent.startsAt)}</span>
                  )}
                </div>
                <h1 className="voter-title">{activeEvent.name}</h1>
                <p className="voter-sub">
                  {activeEvent.description || "Vote for your favourite contestant. Results update live."}
                </p>
                <div className="voter-hero-foot">
                  <span className={`voter-rule${activeEvent.freeVotingEnabled ? "" : " off"}`}>
                    {activeEvent.freeVotingEnabled
                      ? `${freeVotesRemaining} free vote${freeVotesRemaining === 1 ? "" : "s"} left`
                      : "Paid votes only"}
                  </span>
                  <span className={`voter-rule${activeEvent.paidVotingEnabled ? "" : " off"}`}>
                    {activeEvent.paidVotingEnabled
                      ? `₦${activeEvent.paidVotePrice} per paid vote`
                      : "No paid votes"}
                  </span>
                </div>
              </div>
              <div className="voter-total">
                <div className="voter-total-value">{totalVotes.toLocaleString()}</div>
                <div className="voter-total-label">total votes</div>
              </div>
            </div>
          </div>

          <div className="app-wrap">
            <div className="voter-section-head">
              <h2>Leaderboard</h2>
              <span className="voter-section-note">
                <span className="voter-dot" /> updating live
              </span>
            </div>

            <div className="voter-list">
              {ranked.map((c, i) => {
                const share = ranked[0]?.votes ? Math.round((c.votes / ranked[0].votes) * 100) : 0;
                const eliminated = c.status === "eliminated";

                return (
                  <div
                    className={`voter-card${i < 3 ? ` podium podium-${i + 1}` : ""}${eliminated ? " eliminated" : ""}`}
                    key={c.id}
                  >
                    <div className="voter-rank">{i + 1}</div>
                    <div className="voter-avatar">{initials(c.name)}</div>
                    <div className="voter-info">
                      <div className="voter-name">
                        <span>{c.name}</span>
                        {i === 0 && <Crown size={13} className="voter-crown" />}
                        {eliminated && <span className="voter-status">Out</span>}
                      </div>
                      <div className="voter-meta">
                        <span>{c.category}</span>
                        <span className="voter-share">{share}%</span>
                      </div>
                      <div className="voter-track">
                        <span style={{ width: `${share}%` }} />
                      </div>
                    </div>
                    <Sparkline data={voteHistory[c.id]} />
                    <DeltaBadge delta={deltas[c.id]} />
                    <div className="voter-votes">{c.votes.toLocaleString()}</div>
                    <button
                      className="voter-vote-btn"
                      onClick={() => openVoteFlow(c)}
                      disabled={eliminated}
                    >
                      {eliminated ? "Closed" : "Vote"}
                    </button>
                  </div>
                );
              })}
            </div>

            {ranked.length === 0 && (
              <div className="voter-empty">No contestants yet — check back soon.</div>
            )}

            <div className="voter-history">
              <div className="voter-history-title"><History size={13} /> Your past votes</div>
              {myVotes.length === 0 && pastVotes.length === 0 && (
                <div className="voter-history-empty">
                  You haven&apos;t voted yet — pick a contestant above.
                </div>
              )}
              {myVotes.map((v) => (
                <div className="voter-history-row" key={v.id}>
                  <div>
                    <div className="voter-history-event">{v.name}{v.quantity > 1 ? ` ×${v.quantity}` : ""}</div>
                    <div className="voter-history-meta">
                      {v.category} · {v.type === "paid" ? `Paid (₦${v.price} each)` : "Free vote"}
                      {v.eventId !== activeEventId ? ` · ${v.eventName}` : ""}
                    </div>
                  </div>
                  <div className="voter-history-date">
                    Today, {new Date(v.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
              ))}
              {pastVotes.map((v) => (
                <div className="voter-history-row" key={v.contestant}>
                  <div>
                    <div className="voter-history-event">{v.contestant}</div>
                    <div className="voter-history-meta">{v.category}</div>
                  </div>
                  <div className="voter-history-date">{v.date}</div>
                </div>
              ))}
            </div>
          </div>
          </div>
          </div>
        </>
      ) : (
        <>
          <div className="org-topbar">
            <button className="org-topbar-left" onClick={goVoter}>
              <ArrowLeft size={14} /> Voter view
            </button>
            <div className="org-topbar-mid">
              <div className="org-event-select-wrap">
                <div className="org-event-select">
                  <span className="org-event-select-name">{activeEvent.name}</span> <ChevronDown size={15} />
                </div>
                <select
                  className="org-event-select-native"
                  value={eventIndex}
                  onChange={(e) => setEventIndex(Number(e.target.value))}
                  aria-label="Active event"
                >
                  {events.map((ev, i) => <option key={ev.id} value={i}>{ev.name}</option>)}
                </select>
              </div>
              <div className="org-live"><span className="voter-dot"></span> LIVE</div>
            </div>
            <div className="org-topbar-right">
              <button className="app-btn" onClick={exportCSV}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Download size={14} /> <span className="org-btn-label">Export</span>
                </span>
              </button>
              <button className="app-btn primary" onClick={openWizard}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Plus size={14} /> Create event</span>
              </button>
            </div>
          </div>

          <div className="org-dash-header">
            <div>
              <div className="org-eyebrow">Organiser dashboard</div>
              <h1 className="org-dash-title">{activeEvent.name}</h1>
              <div className="org-dash-sub">Live contest performance at a glance.</div>
            </div>
          </div>

          <div className="org-section-tabs">
            {[
              ["overview", "Overview", BarChart3],
              ["contestants", "Contestants", Users2],
              ["audience", "Audience", User],
              ["team", "Team", Users2],
              ["settings", "Settings", SettingsIcon],
            ].map(([key, label, Icon]) => (
              <button
                key={key}
                className={`org-section-tab${orgSection === key ? " active" : ""}`}
                onClick={() => setOrgSection(key)}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          <div className="org-shell">
            <div className="org-content">
              {orgSection === "overview" && (
                <>
                  {activeEvent.cover && (
                    <div className="org-cover">
                      <img src={activeEvent.cover} alt={`${activeEvent.name} cover`} />
                    </div>
                  )}

                  {activeEvent.visibility === "unlisted" && (
                    <ShareLink
                      className="org-share-top"
                      url={shareUrl}
                      onCopy={() => copyText(shareUrl, "Link copied")}
                      label="Link-only event"
                      desc="Not listed anywhere — share this link so people can vote."
                    />
                  )}

                  <div className="org-stat-grid">
                    <div className="org-stat-block">
                      <div className="org-stat-label">Total votes</div>
                      <div className="org-stat-value-row">
                        <span className="org-stat-value">{totalVotes.toLocaleString()}</span>
                        <span className="org-stat-delta"><TrendingUp size={11} /> 8.4%</span>
                      </div>
                    </div>
                    <div className="org-stat-block">
                      <div className="org-stat-label">Unique voters</div>
                      <div className="org-stat-value-row">
                        <span className="org-stat-value">2,104</span>
                        <span className="org-stat-delta"><TrendingUp size={11} /> 12.1%</span>
                      </div>
                    </div>
                    <div className="org-stat-block">
                      <div className="org-stat-label">Votes/min</div>
                      <div className="org-stat-value-row">
                        <span className="org-stat-value">42</span>
                        <span className="org-stat-live">LIVE</span>
                      </div>
                    </div>
                    <div className="org-stat-block">
                      <div className="org-stat-label">Time left</div>
                      <div className="org-stat-value-row">
                        <span className="org-stat-value">2h 18m</span>
                      </div>
                      <div className="org-stat-sub">Today · 1:00 PM</div>
                    </div>
                  </div>

                  <div className="org-panel">
                    <div className="org-panel-head">
                      <div>
                        <h2 className="org-panel-title">Competition pulse</h2>
                        <div className="org-panel-sub">Track the race as votes come in.</div>
                      </div>
                    </div>

                    <div className="org-segmented">
                      <button className={`org-segment${orgTab === "leaderboard" ? " active" : ""}`} onClick={() => setOrgTab("leaderboard")}>Leaderboard</button>
                      <button className={`org-segment${orgTab === "trend" ? " active" : ""}`} onClick={() => setOrgTab("trend")}>Trend</button>
                    </div>

                    {orgTab === "leaderboard" ? (
                      <div>
                        {ranked.map((c, i) => (
                          <div className="org-lb-row" key={c.id}>
                            <div className="voter-rank">{i + 1}</div>
                            <div className="org-lb-avatar">{initials(c.name)}</div>
                            <div className="org-lb-info">
                              <div className="org-lb-name">
                                <span>{c.name}</span>
                                {i === 0 && <Crown size={12} className="voter-crown" />}
                              </div>
                              <div className="org-lb-category">{c.category}</div>
                            </div>
                            <Sparkline data={voteHistory[c.id]} />
                            <DeltaBadge delta={deltas[c.id]} />
                            <div className="org-lb-votes">{c.votes.toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={trendData} margin={{ left: -20, right: 10, top: 10 }}>
                          <CartesianGrid stroke="#E7E3D6" vertical={false} />
                          <XAxis dataKey="t" tick={{ fontSize: 12, fill: "#8B867A" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12, fill: "#8B867A" }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ fontSize: 13, borderRadius: 12, border: "1px solid #E2DED2", background: "#FFFDF7", color: "#14131A" }} labelStyle={{ color: "#8B867A" }} itemStyle={{ color: "#14131A" }} />
                          <Line type="monotone" dataKey="c1" name="1st place" stroke="#F2682A" strokeWidth={2.5} dot={false} />
                          <Line type="monotone" dataKey="c2" name="2nd place" stroke="#3B5BF5" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="c3" name="3rd place" stroke="#9A9488" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="org-panel">
                    <div className="org-panel-head">
                      <h2 className="org-panel-title">Recent activity</h2>
                    </div>
                    {activityLog.length === 0 ? (
                      <div className="empty-state">
                        <h3>No activity yet</h3>
                        <p>Votes, milestones, and lead changes will show up here as they happen.</p>
                      </div>
                    ) : (
                      activityLog.map((item) => (
                        <div className="org-activity-row" key={item.id}>
                          <div className="org-activity-time">{item.time}</div>
                          <div>
                            <div className="org-activity-type">{item.type}</div>
                            <div className="org-activity-desc">{item.description}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {orgSection === "contestants" && (
                <div className="org-panel" style={{ marginTop: 28 }}>
                  <div className="org-panel-head">
                    <div>
                      <h2 className="org-panel-title">Contestants</h2>
                      <div className="org-panel-sub">Manage entries and voting status.</div>
                    </div>
                    <button className="app-btn primary" onClick={() => setAddContestantOpen(true)}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Plus size={14} /> Add contestant</span>
                    </button>
                  </div>
                  {contestants.map((c) => (
                    <div className="org-row" key={c.id}>
                      <div className="org-row-avatar">{initials(c.name)}</div>
                      <div className="org-row-info">
                        <div className="org-row-name">{c.name}</div>
                        <div className="org-row-meta">{c.category}</div>
                      </div>
                      <span className={`org-badge org-badge-secondary ${c.paid ? "paid" : "free"}`}>{c.paid ? "Paid" : "Free"}</span>
                      <span className={`org-badge ${c.status === "eliminated" ? "eliminated" : "active"}`}>
                        {c.status === "eliminated" ? "Eliminated" : "Active"}
                      </span>
                      <div className="org-lb-votes">{c.votes.toLocaleString()}</div>
                      <div className="org-more-wrap">
                        <button
                          className="org-more-btn"
                          onClick={() => setOpenContestantMenu(openContestantMenu === c.id ? null : c.id)}
                        >
                          <MoreVertical size={15} />
                        </button>
                        {openContestantMenu === c.id && (
                          <div className="org-more-menu">
                            <button onClick={() => toggleEliminate(c.id)}>
                              <Trash2 size={13} /> {c.status === "eliminated" ? "Restore" : "Eliminate"}
                            </button>
                            <button onClick={() => { setOpenContestantMenu(null); showToast(`Viewing ${c.name}`); }}>
                              <Eye size={13} /> View
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {orgSection === "audience" && (
                <div style={{ marginTop: 28 }}>
                  <div className="org-stat-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
                    <div className="org-stat-block">
                      <div className="org-stat-label">Unique voters</div>
                      <div className="org-stat-value-row"><span className="org-stat-value">2,104</span></div>
                    </div>
                    <div className="org-stat-block">
                      <div className="org-stat-label">Peak hour</div>
                      <div className="org-stat-value-row"><span className="org-stat-value">7–8 PM</span></div>
                    </div>
                    <div className="org-stat-block">
                      <div className="org-stat-label">Avg votes / voter</div>
                      <div className="org-stat-value-row"><span className="org-stat-value">2.36</span></div>
                    </div>
                  </div>
                  <div className="org-panel">
                    <div className="org-panel-head">
                      <h2 className="org-panel-title">Voters over time</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={audienceTrend} margin={{ left: -20, right: 10, top: 10 }}>
                        <CartesianGrid stroke="#E7E3D6" vertical={false} />
                        <XAxis dataKey="t" tick={{ fontSize: 12, fill: "#8B867A" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: "#8B867A" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: 13, borderRadius: 12, border: "1px solid #E2DED2", background: "#FFFDF7", color: "#14131A" }} labelStyle={{ color: "#8B867A" }} itemStyle={{ color: "#14131A" }} />
                        <Line type="monotone" dataKey="voters" stroke="#3B5BF5" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {orgSection === "team" && (
                <div className="org-panel" style={{ marginTop: 28 }}>
                  <div className="org-panel-head">
                    <div>
                      <h2 className="org-panel-title">Team members</h2>
                      <div className="org-panel-sub">Invite organisers and control access.</div>
                    </div>
                    <button className="app-btn primary" onClick={() => setInviteOpen(true)}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Plus size={14} /> Invite member</span>
                    </button>
                  </div>
                  {teamMembers.map((m) => (
                    <div className="org-row" key={m.email}>
                      <div className="org-row-avatar">{initials(m.name)}</div>
                      <div className="org-row-info">
                        <div className="org-row-name">{m.name}</div>
                        <div className="org-row-meta">Team member</div>
                      </div>
                      <span className={`org-badge ${m.role.toLowerCase()}`}>{m.role}</span>
                      <div className="org-more-wrap">
                        <button
                          className="org-more-btn"
                          onClick={() => setOpenTeamMenu(openTeamMenu === m.email ? null : m.email)}
                        >
                          <MoreVertical size={15} />
                        </button>
                        {openTeamMenu === m.email && (
                          <div className="org-more-menu">
                            {m.role !== "Owner" ? (
                              <button className="danger" onClick={() => removeTeamMember(m.email)}>
                                <Trash2 size={13} /> Remove
                              </button>
                            ) : (
                              <button onClick={() => setOpenTeamMenu(null)}>Owner can't be removed</button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {orgSection === "settings" && (
                <div className="org-panel" style={{ marginTop: 28 }}>
                  <div className="org-setting-row">
                    <div>
                      <div className="org-setting-label">Free voting</div>
                      <div className="org-setting-desc">Let each voter cast a limited number of free votes.</div>
                    </div>
                    <button
                      className={`org-toggle${activeEvent.freeVotingEnabled ? " on" : ""}`}
                      onClick={() => patchEvent({ freeVotingEnabled: !activeEvent.freeVotingEnabled })}
                      aria-label="Toggle free voting"
                    />
                  </div>

                  {activeEvent.freeVotingEnabled && (
                    <div className="org-setting-row">
                      <div>
                        <div className="org-setting-label">Free vote limit</div>
                        <div className="org-setting-desc">Total free votes each voter gets for this event.</div>
                      </div>
                      <div className="org-setting-control" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                          type="number"
                          min="1"
                          style={{ width: 70 }}
                          value={activeEvent.freeVoteLimit}
                          onChange={(e) => patchEvent({ freeVoteLimit: Math.max(1, Number(e.target.value)) })}
                        />
                        <span style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>per voter</span>
                      </div>
                    </div>
                  )}

                  <div className="org-setting-row">
                    <div>
                      <div className="org-setting-label">Paid voting</div>
                      <div className="org-setting-desc">Let voters buy extra votes for a candidate. Purchased votes are locked to that candidate.</div>
                    </div>
                    <button
                      className={`org-toggle${activeEvent.paidVotingEnabled ? " on" : ""}`}
                      onClick={() => patchEvent({ paidVotingEnabled: !activeEvent.paidVotingEnabled })}
                      aria-label="Toggle paid voting"
                    />
                  </div>

                  {activeEvent.paidVotingEnabled && (
                    <div className="org-setting-row">
                      <div>
                        <div className="org-setting-label">Price per vote</div>
                        <div className="org-setting-desc">Total charged is quantity × price — the voter never has to calculate it.</div>
                      </div>
                      <div className="org-setting-control" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        ₦<input
                          type="number"
                          style={{ width: 90 }}
                          value={activeEvent.paidVotePrice}
                          onChange={(e) => patchEvent({ paidVotePrice: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="org-setting-row">
                    <div>
                      <div className="org-setting-label">Close time</div>
                      <div className="org-setting-desc">Voting stops automatically after this time.</div>
                    </div>
                    <div className="org-setting-control">
                      <input
                        type="datetime-local"
                        value={activeEvent.endsAt}
                        onChange={(e) => patchEvent({ endsAt: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="org-setting-row" style={{ alignItems: "flex-start" }}>
                    <div>
                      <div className="org-setting-label">Event visibility</div>
                      <div className="org-setting-desc">Control who can find and vote in this event.</div>
                    </div>
                    <div className="org-setting-control" style={{ minWidth: 200 }}>
                      <label className="org-radio-row">
                        <input
                          type="radio"
                          name="visibility"
                          checked={activeEvent.visibility === "public"}
                          onChange={() => patchEvent({ visibility: "public" })}
                        />
                        <span><strong>Public</strong><small>Listed on StagePick — discoverable by anyone</small></span>
                      </label>
                      <label className="org-radio-row">
                        <input
                          type="radio"
                          name="visibility"
                          checked={activeEvent.visibility === "unlisted"}
                          onChange={() => patchEvent({ visibility: "unlisted" })}
                        />
                        <span><strong>Link-only</strong><small>Not listed anywhere — only the direct link works</small></span>
                      </label>
                    </div>
                  </div>

                  {activeEvent.visibility === "unlisted" && (
                    <ShareLink
                      url={shareUrl}
                      onCopy={() => copyText(shareUrl, "Link copied")}
                      label="Share link"
                      desc="Send this to the people you want voting. It's the only way in."
                    />
                  )}

                  <button
                    className="app-btn primary"
                    style={{ marginTop: 18 }}
                    onClick={() => { showToast("Settings saved"); logActivity("Settings", "Event settings were updated."); }}
                  >
                    Save settings
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Vote flow modal: free vote and/or paid vote with quantity, price, and payment steps */}
      {voteFlow && (
        <div className="app-modal-backdrop" onClick={() => setVoteFlow(null)}>
          <div className="app-modal" onClick={(e) => e.stopPropagation()}>
            {voteFlow.step === "choose" && (
              <>
                <h3>Vote for {voteFlow.contestant.name}</h3>
                <p style={{ marginBottom: 16 }}>{voteFlow.contestant.category}</p>

                {activeEvent.freeVotingEnabled && (
                  <div style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 16, marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>Free vote</div>
                    {freeVotesRemaining > 0 ? (
                      <>
                        <p style={{ margin: "0 0 12px", fontSize: 12.5 }}>Cast 1 free vote for this candidate.</p>
                        <button className="app-btn primary" style={{ width: "100%" }} onClick={() => castFreeVote(voteFlow.contestant)}>
                          Vote Free
                        </button>
                      </>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-dim)" }}>
                        You've used your free vote{activeEvent.freeVoteLimit > 1 ? "s" : ""} for this event.
                      </p>
                    )}
                  </div>
                )}

                {activeEvent.paidVotingEnabled && (
                  <div style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 2 }}>Paid votes</div>
                    <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "var(--ink-dim)" }}>
                      ₦{activeEvent.paidVotePrice} each
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <span style={{ fontSize: 13 }}>How many votes?</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button
                          className="app-btn small"
                          onClick={() => setVoteFlow((f) => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))}
                        >
                          −
                        </button>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, minWidth: 20, textAlign: "center" }}>
                          {voteFlow.quantity}
                        </span>
                        <button
                          className="app-btn small"
                          onClick={() => setVoteFlow((f) => ({ ...f, quantity: f.quantity + 1 }))}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
                      <span>Total</span>
                      <span>₦{(activeEvent.paidVotePrice * voteFlow.quantity).toLocaleString()}</span>
                    </div>
                    <button
                      className="app-btn primary"
                      style={{ width: "100%" }}
                      onClick={() => setVoteFlow((f) => ({ ...f, step: "payment" }))}
                    >
                      Continue to Payment
                    </button>
                  </div>
                )}

                {!activeEvent.freeVotingEnabled && !activeEvent.paidVotingEnabled && (
                  <p style={{ margin: 0 }}>
                    Voting is closed for this event — the organiser hasn't enabled free or paid votes.
                  </p>
                )}
              </>
            )}

            {voteFlow.step === "payment" && (
              <>
                <h3>Confirm purchase</h3>
                <p>
                  {voteFlow.quantity} vote{voteFlow.quantity > 1 ? "s" : ""} × ₦{activeEvent.paidVotePrice} = ₦
                  {(voteFlow.quantity * activeEvent.paidVotePrice).toLocaleString()}
                </p>
                <p>
                  You'll receive {voteFlow.quantity} paid vote{voteFlow.quantity > 1 ? "s" : ""} for {voteFlow.contestant.name} after successful payment.
                </p>
                <div className="app-modal-actions">
                  <button className="app-btn" onClick={() => setVoteFlow((f) => ({ ...f, step: "choose" }))}>Back</button>
                  <button className="app-btn primary" onClick={() => setVoteFlow((f) => ({ ...f, step: "success" }))}>
                    Pay ₦{(voteFlow.quantity * activeEvent.paidVotePrice).toLocaleString()}
                  </button>
                </div>
              </>
            )}

            {voteFlow.step === "success" && (
              <>
                <h3>Payment successful</h3>
                <p>You purchased {voteFlow.quantity} vote{voteFlow.quantity > 1 ? "s" : ""} for {voteFlow.contestant.name}.</p>
                <button className="app-btn primary" style={{ width: "100%" }} onClick={castPaidVotes}>
                  Cast {voteFlow.quantity} Vote{voteFlow.quantity > 1 ? "s" : ""}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create event wizard — Basics, Visibility, Voting, Contestants */}
      {wizardOpen && (
        <div className="app-modal-backdrop" onClick={() => setWizardOpen(false)}>
          <div className="app-modal wide" onClick={(e) => e.stopPropagation()}>
            <h3>Create an event</h3>
            <p style={{ marginBottom: 18 }}>Four quick steps. Everything here can be changed later.</p>

            <div className="org-wizard-steps">
              {WIZARD_STEPS.map((label, i) => (
                <span
                  key={label}
                  className={`org-wizard-step${i === wizardStep ? " active" : ""}${i < wizardStep ? " done" : ""}`}
                >
                  <span className="org-wizard-step-num">{i < wizardStep ? "✓" : i + 1}</span>
                  {label}
                </span>
              ))}
            </div>

            <div className="org-wizard-body">
              {wizardStep === 0 && (
                <>
                  <div className="app-field">
                    <label>Event name</label>
                    <input
                      type="text"
                      placeholder="e.g. Campus Talent Night 2026"
                      value={draft.name}
                      onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    />
                  </div>

                  <div className="app-field">
                    <label>Description</label>
                    <input
                      type="text"
                      placeholder="A short line voters will see"
                      value={draft.description}
                      onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                    />
                  </div>

                  <div className="app-field">
                    <label>Cover image</label>
                    <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={handleCoverFile} />
                    {draft.cover ? (
                      <div className="org-cover-preview">
                        <img src={draft.cover} alt="Cover preview" />
                        <div className="org-cover-preview-bar">
                          <span>Cover selected</span>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" className="app-btn small" onClick={() => coverInputRef.current?.click()}>
                              Replace
                            </button>
                            <button
                              type="button"
                              className="app-btn small"
                              onClick={() => setDraft((d) => ({ ...d, cover: null }))}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button type="button" className="org-cover-drop" onClick={() => coverInputRef.current?.click()}>
                        <strong><ImagePlus size={14} /> Choose an image from your device</strong>
                        <small>PNG or JPG, up to 5 MB</small>
                      </button>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <div className="app-field" style={{ flex: 1, minWidth: 0 }}>
                      <label>Starts</label>
                      <input
                        type="datetime-local"
                        value={draft.startsAt}
                        onChange={(e) => setDraft((d) => ({ ...d, startsAt: e.target.value }))}
                      />
                    </div>
                    <div className="app-field" style={{ flex: 1, minWidth: 0 }}>
                      <label>Voting closes</label>
                      <input
                        type="datetime-local"
                        value={draft.endsAt}
                        onChange={(e) => setDraft((d) => ({ ...d, endsAt: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )}

              {wizardStep === 1 && (
                <>
                  <button
                    type="button"
                    className={`org-choice${draft.visibility === "public" ? " active" : ""}`}
                    onClick={() => setDraft((d) => ({ ...d, visibility: "public" }))}
                  >
                    <strong>Public</strong>
                    <small>Listed on StagePick — anyone can find it and vote.</small>
                  </button>
                  <button
                    type="button"
                    className={`org-choice${draft.visibility === "unlisted" ? " active" : ""}`}
                    onClick={() => setDraft((d) => ({ ...d, visibility: "unlisted" }))}
                  >
                    <strong>Link-only</strong>
                    <small>Not listed anywhere. Only the people you send the link to can vote.</small>
                  </button>

                  {draft.visibility === "unlisted" && (
                    <div className="org-share-inline">
                      <div className="org-setting-desc" style={{ marginBottom: 8 }}>
                        Your event link — you can copy it again any time from Settings.
                      </div>
                      <div className="org-share-control">
                        <input
                          type="text"
                          readOnly
                          value={shareUrlFor(draft.name)}
                          onFocus={(e) => e.target.select()}
                          aria-label="Event share link"
                        />
                        <button
                          type="button"
                          className="app-btn small"
                          onClick={() => copyText(shareUrlFor(draft.name), "Link copied")}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Copy size={12} /> Copy</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {wizardStep === 2 && (
                <>
                  <div className="org-setting-row" style={{ borderTop: "none", paddingTop: 0 }}>
                    <div>
                      <div className="org-setting-label">Free voting</div>
                      <div className="org-setting-desc">Each voter gets a limited number of free votes.</div>
                    </div>
                    <button
                      type="button"
                      className={`org-toggle${draft.freeVotingEnabled ? " on" : ""}`}
                      onClick={() => setDraft((d) => ({ ...d, freeVotingEnabled: !d.freeVotingEnabled }))}
                      aria-label="Toggle free voting"
                    />
                  </div>

                  {draft.freeVotingEnabled && (
                    <div className="org-setting-row">
                      <div>
                        <div className="org-setting-label">Free vote limit</div>
                        <div className="org-setting-desc">Total free votes each voter gets, across the whole event.</div>
                      </div>
                      <div className="org-setting-control" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                          type="number"
                          min="1"
                          style={{ width: 70 }}
                          value={draft.freeVoteLimit}
                          onChange={(e) => setDraft((d) => ({ ...d, freeVoteLimit: Math.max(1, Number(e.target.value)) }))}
                        />
                        <span style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>per voter</span>
                      </div>
                    </div>
                  )}

                  <div className="org-setting-row">
                    <div>
                      <div className="org-setting-label">Paid voting</div>
                      <div className="org-setting-desc">Voters can buy extra votes. Purchased votes are locked to that candidate.</div>
                    </div>
                    <button
                      type="button"
                      className={`org-toggle${draft.paidVotingEnabled ? " on" : ""}`}
                      onClick={() => setDraft((d) => ({ ...d, paidVotingEnabled: !d.paidVotingEnabled }))}
                      aria-label="Toggle paid voting"
                    />
                  </div>

                  {draft.paidVotingEnabled && (
                    <div className="org-setting-row">
                      <div>
                        <div className="org-setting-label">Price per vote</div>
                        <div className="org-setting-desc">Total charged is quantity × price.</div>
                      </div>
                      <div className="org-setting-control" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        ₦<input
                          type="number"
                          style={{ width: 90 }}
                          value={draft.paidVotePrice}
                          onChange={(e) => setDraft((d) => ({ ...d, paidVotePrice: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                  )}

                  {!draft.freeVotingEnabled && !draft.paidVotingEnabled && (
                    <div className="empty-state">
                      <h3>No way to vote</h3>
                      <p>Turn on free voting, paid voting, or both.</p>
                    </div>
                  )}
                </>
              )}

              {wizardStep === 3 && (
                <>
                  <p style={{ marginBottom: 14 }}>
                    Add the people voters choose between. Blank rows are skipped — you can also add
                    contestants later from the Contestants tab.
                  </p>
                  {draft.rows.map((row, i) => (
                    <div className="org-draft-row" key={row.key}>
                      <input
                        type="text"
                        placeholder={`Contestant ${i + 1} name`}
                        value={row.name}
                        onChange={(e) => updateDraftRow(row.key, { name: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Category"
                        value={row.category}
                        onChange={(e) => updateDraftRow(row.key, { category: e.target.value })}
                      />
                      <label className="org-draft-paid">
                        <input
                          type="checkbox"
                          checked={row.paid}
                          onChange={(e) => updateDraftRow(row.key, { paid: e.target.checked })}
                        />
                        Paid
                      </label>
                      {draft.rows.length > 1 && (
                        <button
                          type="button"
                          className="org-more-btn"
                          onClick={() => removeDraftRow(row.key)}
                          aria-label={`Remove contestant ${i + 1}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="app-btn" style={{ marginTop: 4 }} onClick={addDraftRow}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Plus size={14} /> Add another</span>
                  </button>
                </>
              )}
            </div>

            <div className="org-wizard-actions">
              <button
                className="app-btn"
                onClick={() => (wizardStep === 0 ? setWizardOpen(false) : setWizardStep((s) => s - 1))}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {wizardStep > 0 && <ChevronLeft size={14} />}
                  {wizardStep === 0 ? "Cancel" : "Back"}
                </span>
              </button>

              {wizardStep < WIZARD_STEPS.length - 1 ? (
                <button
                  className="app-btn primary"
                  disabled={wizardStep === 0 && !draft.name.trim()}
                  onClick={() => setWizardStep((s) => s + 1)}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    Next <ChevronRight size={14} />
                  </span>
                </button>
              ) : (
                <button className="app-btn primary" onClick={createEvent}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Check size={14} /> Create event
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add contestant modal */}
      {addContestantOpen && (
        <div className="app-modal-backdrop" onClick={() => setAddContestantOpen(false)}>
          <div className="app-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add contestant</h3>
            <div className="app-field">
              <label>Name</label>
              <input
                type="text"
                placeholder="e.g. Faith Nwosu"
                value={newContestant.name}
                onChange={(e) => setNewContestant((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className="app-field">
              <label>Category</label>
              <input
                type="text"
                placeholder="e.g. Category A"
                value={newContestant.category}
                onChange={(e) => setNewContestant((s) => ({ ...s, category: e.target.value }))}
              />
            </div>
            <label className="org-radio-row" style={{ alignItems: "center" }}>
              <input
                type="checkbox"
                checked={newContestant.paid}
                onChange={(e) => setNewContestant((s) => ({ ...s, paid: e.target.checked }))}
              />
              <span>Participant has paid their entry fee</span>
            </label>
            <div className="app-modal-actions" style={{ marginTop: 18 }}>
              <button className="app-btn" onClick={() => setAddContestantOpen(false)}>Cancel</button>
              <button
                className="app-btn primary"
                onClick={() => {
                  if (!newContestant.name.trim()) return;
                  const contestant = {
                    id: `c${contestants.length + 1}-${Date.now()}`,
                    name: newContestant.name.trim(),
                    category: newContestant.category.trim() || "General",
                    votes: 0,
                    status: "active",
                    paid: newContestant.paid,
                  };
                  setContestants((prev) => [...prev, contestant]);
                  setNewContestant({ name: "", category: "", paid: false });
                  setAddContestantOpen(false);
                  showToast("Contestant added");
                  logActivity("Contestant added", `${contestant.name} joined ${contestant.category}.`);
                }}
              >
                Add contestant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite team member modal */}
      {inviteOpen && (
        <div className="app-modal-backdrop" onClick={() => setInviteOpen(false)}>
          <div className="app-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Invite a co-organiser</h3>
            <div className="app-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={inviteDraft.email}
                onChange={(e) => setInviteDraft((s) => ({ ...s, email: e.target.value }))}
              />
            </div>
            <div className="app-field">
              <label>Role</label>
              <select
                value={inviteDraft.role}
                onChange={(e) => setInviteDraft((s) => ({ ...s, role: e.target.value }))}
              >
                <option value="Viewer">Viewer — can see results</option>
                <option value="Editor">Editor — can manage contestants</option>
              </select>
            </div>
            <div className="app-modal-actions">
              <button className="app-btn" onClick={() => setInviteOpen(false)}>Cancel</button>
              <button
                className="app-btn primary"
                onClick={() => {
                  if (!inviteDraft.email.trim()) return;
                  setTeamMembers((prev) => [
                    ...prev,
                    { name: inviteDraft.email.split("@")[0], email: inviteDraft.email.trim(), role: inviteDraft.role },
                  ]);
                  setInviteDraft({ email: "", role: "Viewer" });
                  setInviteOpen(false);
                  showToast("Invite sent");
                  logActivity("Team invite", `Invited ${inviteDraft.email} as ${inviteDraft.role}.`);
                }}
              >
                Send invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile modal */}
      {profileOpen && (
        <div className="app-modal-backdrop" onClick={() => setProfileOpen(false)}>
          <div className="app-modal" onClick={(e) => e.stopPropagation()}>
            <div className="app-profile-head">
              <div className="app-profile-avatar">{initials(currentUser.name)}</div>
              <div>
                <div className="app-profile-name">{currentUser.name}</div>
                <div className="app-profile-email">{currentUser.email}</div>
              </div>
            </div>

            <div className="app-field" style={{ marginBottom: 4 }}>
              <label>Username</label>
              {editingUsername ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="text" value={usernameDraft} onChange={(e) => setUsernameDraft(e.target.value)} autoFocus />
                  <button
                    className="app-btn primary small"
                    onClick={() => {
                      const clean = usernameDraft.trim();
                      if (!clean) return;
                      setCurrentUser((u) => ({ ...u, username: clean }));
                      setEditingUsername(false);
                      showToast("Username updated");
                    }}
                  >
                    Save
                  </button>
                  <button className="app-btn small" onClick={() => setEditingUsername(false)}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>@{currentUser.username}</span>
                  <button
                    className="app-btn small"
                    onClick={() => { setUsernameDraft(currentUser.username); setEditingUsername(true); }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Pencil size={12} /> Edit</span>
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="app-profile-row"><span>Member since</span><span>{currentUser.memberSince}</span></div>
              <div className="app-profile-row"><span>Events participated</span><span>{currentUser.eventsParticipated.length}</span></div>
              <div className="app-profile-row">
                <span>Votes in current event</span>
                <span>{myVotesForEvent.reduce((s, v) => s + v.quantity, 0)}</span>
              </div>
              <div className="app-profile-row">
                <span>All-time votes</span>
                <span>{currentUser.totalVotesCastAllTime + myVotes.reduce((s, v) => s + v.quantity, 0)}</span>
              </div>
            </div>

            <div className="app-modal-actions" style={{ marginTop: 20 }}>
              <button className="app-btn" onClick={() => setProfileOpen(false)}>Close</button>
              <button className="app-btn primary" onClick={handleSignOut}>Sign out</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`app-toast${toastCelebration ? " celebration" : ""}`}>
          {toastCelebration ? <PartyPopper size={15} /> : <Check size={15} />} {toast}
        </div>
      )}
    </div>
  );
}
