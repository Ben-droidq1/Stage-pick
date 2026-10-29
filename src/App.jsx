import { lazy, Suspense, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Crown,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";
import "./App.css";
import StagePickLanding from "./landing.jsx";
import { DEMO_ACCOUNT, EMAIL_RE, checkCredentials, publicAccount } from "./authStore";

// The dashboard pulls in the charting library, so only load it once the
// visitor actually opens the app — the landing page stays lightweight.
const StagePickApp = lazy(() => import("./Dashboard.jsx"));
// The voter home screen: paper theme, mobile-first, free/paid voting.
const StagePickHome = lazy(() => import("./StagePickApp.jsx"));

// Why someone would sign up, shown on the brand panel.
const AUTH_POINTS = [
  "Live leaderboards that update as votes land",
  "Free and paid voting on the same event",
  "Shareable links for every contest",
];

// Static sample board on the brand panel. No timer here on purpose — the
// signup page shouldn't burn CPU animating behind a form.
const PREVIEW_BOARD = [
  { name: "Bella Babalola", votes: 1250, lead: true },
  { name: "Emanuella Adinye", votes: 1124 },
  { name: "Peace Chituga", votes: 987 },
];

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function GoogleMark() {
  return (
    <svg className="auth-google-mark" viewBox="0 0 18 18" width="17" height="17" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function App() {
  const [view, setView] = useState(
    new URLSearchParams(window.location.search).get("view") || "landing",
  );
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [authMode, setAuthMode] = useState("signup"); // "signup" | "login"
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [users, setUsers] = useState(() => [DEMO_ACCOUNT]);
  const [account, setAccount] = useState(null);
  const [signedIn, setSignedIn] = useState(false);

  const handleGetStarted = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", "oauth");
    window.history.replaceState(null, "", url.toString());
    setAuthMode("signup");
    setErrors({});
    setView("oauth");
  };
  const handleBack = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", "landing");
    window.history.replaceState(null, "", url.toString());
    setView("landing");
  };

  // The single source of truth for both the landing signup form and the
  // voter app's sign-in sheet. Returns { ok, account, error } so callers can
  // show the failure inline without guessing what went wrong.
  const signInWithPassword = (attempt) => {
    const result = checkCredentials(users, attempt);

    if (!result.ok) {
      return result;
    }

    if (result.created) {
      setUsers((prev) => [...prev, result.created]);
    }

    setAccount(result.account);
    setSignedIn(true);
    return result;
  };

  const signOut = () => {
    setAccount(null);
    setSignedIn(false);
  };

  const openHome = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", "home");
    url.searchParams.delete("mode");
    url.searchParams.delete("wizard");
    window.history.replaceState(null, "", url.toString());
    setView("home");
  };

  // Google is a demo shortcut: it signs into the seeded account.
  const handleAuth = () => {
    const next = publicAccount(users[0]);
    setAccount(next);
    setSignedIn(true);
    openHome();
  };

  // Keep the organiser dashboard reachable from the voter home. The query
  // string is the source of truth because Dashboard reads it on mount.
  const openOrganizer = (wizard = false) => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", "voter");
    url.searchParams.set("mode", "organizer");
    if (wizard) url.searchParams.set("wizard", "1");
    else url.searchParams.delete("wizard");
    window.history.replaceState(null, "", url.toString());
    setSignedIn(true);
    setAccount((current) => current || publicAccount(users[0]));
    setView("voter");
  };

  const updateField = (key) => (event) => {
    const { value } = event.target;

    setAuthForm((current) => ({ ...current, [key]: value }));
    // Clear a field's error as soon as the visitor starts fixing it.
    setErrors((current) => (current[key] ? { ...current, [key]: "" } : current));
  };

  const handleEmailSubmit = (event) => {
    event.preventDefault();

    const next = {};

    if (authMode === "signup" && authForm.name.trim().length < 2) {
      next.name = "Tell us what to call you.";
    }

    if (!EMAIL_RE.test(authForm.email.trim())) {
      next.email = "Enter a valid email address.";
    }

    if (authForm.password.length < 8) {
      next.password = "Use at least 8 characters.";
    }

    if (authMode === "signup" && authForm.confirmPassword !== authForm.password) {
      next.confirmPassword = "Passwords do not match.";
    }

    setErrors(next);

    if (Object.keys(next).length > 0) {
      return;
    }

    const result = signInWithPassword({ mode: authMode, ...authForm });

    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }

    openHome();
  };

  const switchAuthMode = () => {
    setAuthMode((mode) => (mode === "signup" ? "login" : "signup"));
    setErrors({});
    setShowPassword(false);
    setShowConfirm(false);
  };

  if (view === "oauth") {
    return (
      <div className="auth-page">
        <aside className="auth-aside">
          <div className="auth-aside-glow" aria-hidden="true" />

          <div className="auth-brand">
            <span className="auth-mark">
              <Crown size={16} aria-hidden="true" />
            </span>
            <span>StagePick</span>
          </div>

          <div className="auth-pitch">
            <h1>
              Run the vote.
              <br />
              Keep the <em>revenue</em>.
            </h1>
            <p>
              Create an event, add your contestants, and let the audience vote —
              free or paid. You set the price, and StagePick takes no cut.
            </p>

            <ul className="auth-points">
              {AUTH_POINTS.map((point) => (
                <li key={point}>
                  <span className="auth-tick">
                    <Check size={11} aria-hidden="true" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="auth-preview" aria-hidden="true">
            <div className="auth-preview-head">
              <span>Leaderboard</span>
              <span className="auth-preview-live">
                <span className="auth-dot" /> Live
              </span>
            </div>

            {PREVIEW_BOARD.map((row) => (
              <div className={`auth-preview-row${row.lead ? " lead" : ""}`} key={row.name}>
                <span className="auth-avatar">{initials(row.name)}</span>
                <span className="auth-preview-name">{row.name}</span>
                {row.lead && <Crown size={12} className="auth-preview-crown" />}
                <span className="auth-preview-votes">{row.votes.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="auth-main">
          <div className="auth-card">
            <div className="auth-mobile-brand">
              <span className="auth-mark">
                <Crown size={15} aria-hidden="true" />
              </span>
              <span>StagePick</span>
            </div>

            <button type="button" className="auth-back" onClick={handleBack}>
              <ArrowLeft size={14} aria-hidden="true" />
              Back to home
            </button>

            <header className="auth-head">
              <span className="auth-eyebrow">
                <span className="auth-dot" />
                {authMode === "signup" ? "Free to start" : "Welcome back"}
              </span>
              <h2>{authMode === "signup" ? "Create your account" : "Log in to your account"}</h2>
              <p>
                {authMode === "signup"
                  ? "Start hosting in under a minute. No card required."
                  : "Your events, votes and receipts are right where you left them."}
              </p>
            </header>

            <button type="button" className="auth-oauth" onClick={handleAuth}>
              <GoogleMark />
              Continue with Google
            </button>

            <div className="auth-divider">
              <span>{authMode === "signup" ? "or sign up with email" : "or log in with email"}</span>
            </div>

            <form className="auth-form" onSubmit={handleEmailSubmit} noValidate>
              {authMode === "signup" && (
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-name">
                    Your name
                  </label>
                  <div className={`auth-input${errors.name ? " has-error" : ""}`}>
                    <User size={15} className="auth-input-icon" aria-hidden="true" />
                    <input
                      id="auth-name"
                      type="text"
                      value={authForm.name}
                      onChange={updateField("name")}
                      placeholder="Ada Obi"
                      autoComplete="name"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "auth-error-name" : undefined}
                    />
                  </div>
                  {errors.name && (
                    <span className="auth-error" id="auth-error-name">
                      {errors.name}
                    </span>
                  )}
                </div>
              )}

              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-email">
                  Email address
                </label>
                <div className={`auth-input${errors.email ? " has-error" : ""}`}>
                  <Mail size={15} className="auth-input-icon" aria-hidden="true" />
                  <input
                    id="auth-email"
                    type="email"
                    value={authForm.email}
                    onChange={updateField("email")}
                    placeholder="ada@example.com"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "auth-error-email" : undefined}
                  />
                </div>
                {errors.email && (
                  <span className="auth-error" id="auth-error-email">
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-password">
                  Password
                </label>
                <div className={`auth-input${errors.password ? " has-error" : ""}`}>
                  <Lock size={15} className="auth-input-icon" aria-hidden="true" />
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    value={authForm.password}
                    onChange={updateField("password")}
                    placeholder="At least 8 characters"
                    autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "auth-error-password" : undefined}
                  />
                  <button
                    type="button"
                    className="auth-reveal"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="auth-error" id="auth-error-password">
                    {errors.password}
                  </span>
                )}
              </div>

              {authMode === "signup" && (
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-confirm">
                    Confirm password
                  </label>
                  <div className={`auth-input${errors.confirmPassword ? " has-error" : ""}`}>
                    <Lock size={15} className="auth-input-icon" aria-hidden="true" />
                    <input
                      id="auth-confirm"
                      type={showConfirm ? "text" : "password"}
                      value={authForm.confirmPassword}
                      onChange={updateField("confirmPassword")}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby={errors.confirmPassword ? "auth-error-confirm" : undefined}
                    />
                    <button
                      type="button"
                      className="auth-reveal"
                      onClick={() => setShowConfirm((value) => !value)}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="auth-error" id="auth-error-confirm">
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>
              )}

              {errors.form && (
                <p className="auth-form-error" role="alert">
                  {errors.form}
                </p>
              )}

              {authMode === "login" && (
                <p className="auth-hint">
                  Demo account: <b>alex@example.com</b> · <b>stagepick123</b>
                </p>
              )}

              <button type="submit" className="auth-submit">
                {authMode === "signup" ? "Create account" : "Log in"}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </form>

            <p className="auth-fineprint">
              By continuing you agree to our <a href="#terms">Terms</a> and{" "}
              <a href="#privacy">Privacy Policy</a>.
            </p>

            <p className="auth-switch">
              {authMode === "signup" ? "Already have an account?" : "New to StagePick?"}{" "}
              <button type="button" onClick={switchAuthMode}>
                {authMode === "signup" ? "Log in" : "Create one"}
              </button>
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (view === "home") {
    return (
      <Suspense fallback={<div className="app-loading">Loading StagePick…</div>}>
        <StagePickHome
          startSignedIn={signedIn}
          initialAccount={account}
          onSignIn={signInWithPassword}
          onSignOut={signOut}
          onOpenOrganizer={openOrganizer}
        />
      </Suspense>
    );
  }

  if (view === "voter") {
    return (
      <Suspense fallback={<div className="app-loading">Loading StagePick…</div>}>
        <StagePickApp onOpenHome={openHome} />
      </Suspense>
    );
  }

  return <StagePickLanding onGetStarted={handleGetStarted} />;
}

export default App;
