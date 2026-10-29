import { useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID, loadGoogleIdentity } from "./googleAuth";

/* Renders Google's own "Continue with Google" button.

   Google's branding rules require the real button (not a look-alike), so we
   mount it into a container and keep it as wide as the auth card. The button
   has to be redrawn by hand when the card resizes because GIS only accepts a
   pixel width. */

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export function GoogleMark() {
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

export default function GoogleSignInButton({ onCredential, onUnavailable }) {
  const holder = useRef(null);
  const credentialHandler = useRef(onCredential);
  const unavailableHandler = useRef(onUnavailable);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "failed"

  // Keep the latest callbacks without re-running the effect (which would
  // initialise GIS a second time).
  useEffect(() => {
    credentialHandler.current = onCredential;
    unavailableHandler.current = onUnavailable;
  });

  useEffect(() => {
    const node = holder.current;
    let cancelled = false;
    let client = null;
    let observer = null;
    let drawnWidth = 0;

    const draw = () => {
      if (!client || !node) return;

      const available = node.clientWidth || 320;
      const width = Math.min(Math.max(available, MIN_WIDTH), MAX_WIDTH);

      // GIS throws if you draw the same width twice, and the resize observer
      // fires in bursts while the card animates — ignore small changes.
      if (Math.abs(width - drawnWidth) < 8) return;

      drawnWidth = width;
      node.replaceChildren();
      client.renderButton(node, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        logo_alignment: "left",
        width,
      });
    };

    loadGoogleIdentity()
      .then((idClient) => {
        if (cancelled || !node) return;

        client = idClient;
        client.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: "popup",
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: (response) => credentialHandler.current?.(response),
        });

        setStatus("ready");
        draw();

        if (typeof ResizeObserver === "function") {
          observer = new ResizeObserver(draw);
          observer.observe(node);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("failed");
        unavailableHandler.current?.();
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
      node?.replaceChildren();
    };
  }, []);

  if (status === "failed") {
    return (
      <button type="button" className="auth-oauth" disabled aria-disabled="true">
        <GoogleMark />
        Continue with Google
      </button>
    );
  }

  return (
    <div
      className={`auth-google${status === "loading" ? " is-loading" : ""}`}
      ref={holder}
      aria-busy={status !== "ready"}
    />
  );
}
