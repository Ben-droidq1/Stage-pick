/* Google Identity Services (GIS) helpers.

   A Google web client ID is a public identifier — it ships in the page source
   by design, so there is no secret to hide here. Set VITE_GOOGLE_CLIENT_ID in
   frontend/.env.local (or the Vercel project settings) to override the value
   below, e.g. when you move to a different Google Cloud project. */

const FALLBACK_CLIENT_ID =
  "660620187732-nmt5jr5uocj77fq5181j3knk360hnqon.apps.googleusercontent.com";

export const GOOGLE_CLIENT_ID =
  String(import.meta.env?.VITE_GOOGLE_CLIENT_ID || "").trim() || FALLBACK_CLIENT_ID;

const SCRIPT_ID = "google-identity-services";
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let pending = null;

/**
 * Load the GIS script once and resolve with window.google.accounts.id.
 * Safe to call from several components — later calls share the first promise.
 */
export function loadGoogleIdentity() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Google sign-in needs a browser."));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id);
  }

  if (pending) {
    return pending;
  }

  pending = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    const script = existing || document.createElement("script");

    const settle = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
        return;
      }

      pending = null;
      reject(new Error("Google sign-in did not finish loading."));
    };

    const fail = () => {
      pending = null;
      reject(new Error("Google sign-in could not be loaded."));
    };

    script.addEventListener("load", settle, { once: true });
    script.addEventListener("error", fail, { once: true });

    if (existing) {
      // The tag is already in the document; if its load event fired before we
      // attached a listener the check above would have caught it.
      return;
    }

    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });

  return pending;
}

function base64urlToJson(segment) {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return JSON.parse(new TextDecoder().decode(bytes));
}

/**
 * Read the profile out of the ID token Google hands back. We only use this to
 * personalise the session in the browser — a real backend must verify the
 * signature before trusting these claims.
 */
export function decodeCredential(credential) {
  if (typeof credential !== "string") {
    return null;
  }

  const parts = credential.split(".");

  if (parts.length < 2) {
    return null;
  }

  try {
    return base64urlToJson(parts[1]);
  } catch {
    return null;
  }
}

/** Turn a Google ID-token payload into the shape the app stores for accounts. */
export function accountFromProfile(profile) {
  const email = String(profile?.email || "").trim();
  const name =
    String(profile?.name || "").trim() ||
    String(profile?.given_name || "").trim() ||
    email.split("@")[0];

  return {
    name,
    email,
    joined:
      "Member since " +
      new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
  };
}
