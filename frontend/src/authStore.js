/* Credential checks for the demo auth flows.

   No backend: accounts live in memory for the session. Keeping the rules in
   one place means the landing sign-up form and the voter sign-in sheet can
   never disagree about what makes valid credentials. */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const DEMO_ACCOUNT = {
  name: "Alex Morgan",
  email: "alex@example.com",
  password: "stagepick123",
  joined: "Member since March 2025",
};

// Never hand a password back to the UI.
export const publicAccount = (user) => ({
  name: user.name,
  email: user.email,
  joined: user.joined,
});

/**
 * Check a sign-in or sign-up attempt against the in-memory user list.
 * Returns { ok: true, account, created? } or { ok: false, error }.
 * `created` is the full record (with password) so the caller can append it.
 */
export function checkCredentials(users, { mode, name = "", email, password }) {
  const trimmedEmail = String(email || "").trim();
  const trimmedName = String(name || "").trim();
  const address = trimmedEmail.toLowerCase();
  const existing = users.find((user) => user.email.toLowerCase() === address);
  // The landing page says "login", the vote sheet says "signin".
  const isLogin = mode === "login" || mode === "signin";

  if (!trimmedEmail) return { ok: false, error: "Enter your email address." };
  if (!EMAIL_RE.test(trimmedEmail)) {
    return { ok: false, error: "Enter a valid email address, like ada@example.com." };
  }
  if (String(password || "").length < 8) {
    return { ok: false, error: "Passwords need at least 8 characters." };
  }
  if (!isLogin && trimmedName.length < 2) {
    return { ok: false, error: "Tell us what to call you." };
  }

  if (isLogin) {
    if (!existing) {
      return { ok: false, error: "No account uses that email yet. Create one instead." };
    }
    if (existing.password !== password) {
      return { ok: false, error: "That password doesn't match. Try again." };
    }
    return { ok: true, account: publicAccount(existing) };
  }

  if (existing) {
    return { ok: false, error: "An account with that email already exists. Log in instead." };
  }

  const created = {
    name: trimmedName,
    email: trimmedEmail,
    password,
    joined:
      "Member since " +
      new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
  };

  return { ok: true, account: publicAccount(created), created };
}
