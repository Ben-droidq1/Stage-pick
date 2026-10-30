/* Client for the StagePick user API (backend/, deployed on Render).

   The bundle is shared between local dev and the Vercel deployment, so the base
   URL comes from VITE_API_URL and falls back to the deployed API.

   Nothing here is allowed to block a sign-in: a cold Render instance can take
   half a minute to wake up, so every call resolves to null on failure instead
   of throwing, and callers fire it without waiting. */

const DEFAULT_API_URL = "https://stage-pick.onrender.com";

export const API_BASE_URL =
  String(import.meta.env?.VITE_API_URL || "").trim().replace(/\/+$/, "") || DEFAULT_API_URL;

/**
 * Record a sign-up on the backend.
 * Resolves with the created user, or null when the API is unreachable, the
 * email is already registered (409) or the payload is rejected (400).
 */
export async function createUser({ fullName, email, authProvider = "email" }) {
  if (!fullName || !email) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, authProvider }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user ?? null;
  } catch {
    // Offline, DNS failure, cold start killed the request — sign-in still works.
    return null;
  }
}
