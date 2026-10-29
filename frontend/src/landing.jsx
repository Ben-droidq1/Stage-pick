import { useEffect, useState } from "react";
import { ArrowRight, Check, Crown, X } from "lucide-react";
import "./landing.css";

const initialBoard = [
  { name: "Bella Babalola", votes: 1250 },
  { name: "Emanuella Adinye", votes: 1124 },
  { name: "Peace Chituga", votes: 987 },
];

const FEATURES = [
  [
    "01",
    "Live leaderboard",
    "Standings update the instant a vote lands — on your screen, on the venue projector, on the contestants' phones.",
    "m1",
  ],
  [
    "02",
    "Free & paid voting",
    "Give every voter a free vote, then let them buy more — quantity, total, and what happens next, always shown before payment.",
    "m2",
  ],
  [
    "03",
    "One vote per person",
    "Free votes are capped per voter and enforced on the server — not just hidden in the UI.",
    "m3",
  ],
  [
    "04",
    "Public or link-only",
    "List your event publicly, or keep it unlisted and share a single link — your call, per event.",
    "m2",
  ],
  [
    "05",
    "Contest admin panel",
    "Add contestants, open and close rounds, and eliminate contestants without touching a spreadsheet.",
    "m3",
  ],
  [
    "06",
    "Exportable results",
    "Download a timestamped record of every vote once the round closes — useful the moment anyone asks questions.",
    "m1",
  ],
];

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// A small flat shape cluster, styled after the Echo header set.
function GeoMark({ variant = "m1" }) {
  return (
    <span className={`lp-geo ${variant}`} aria-hidden="true">
      <i className="g1" />
      <i className="g2" />
      <i className="g3" />
    </span>
  );
}

// The hero's live leaderboard preview ticks on its own, so updating it
// never re-renders the rest of the landing page.
function HeroArt() {
  const [board, setBoard] = useState(initialBoard);

  useEffect(() => {
    const id = setInterval(() => {
      // Skip the update when the tab is in the background.
      if (document.hidden) return;

      setBoard((prev) => {
        const next = prev.map((contestant) => {
          const bump = Math.random() < 0.6 ? Math.floor(Math.random() * 4) : 0;
          return { ...contestant, votes: contestant.votes + bump };
        });

        return [...next].sort((a, b) => b.votes - a.votes);
      });
    }, 2200);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="lp-art" aria-hidden="true">
      <span className="lp-blob green" />
      <span className="lp-blob blue" />
      <span className="lp-blob orange" />
      <span className="lp-tri" />

      <div className="lp-bubble">
        <span className="lp-bubble-lines">
          <i />
          <i />
        </span>
        <div className="lp-bubble-copy">
          <strong>8h left</strong>
          <small>to vote</small>
        </div>
      </div>

      <div className="lp-board">
        <div className="lp-board-head">
          <span>Leaderboard</span>
          <span className="lp-board-live">
            <i className="lp-dot" /> Live
          </span>
        </div>

        {board.map((contestant, index) => (
          <div className={`lp-board-row${index === 0 ? " lead" : ""}`} key={contestant.name}>
            <span className="lp-board-rank">{index + 1}</span>
            <span className={`lp-board-av av-${index}`}>{initials(contestant.name)}</span>
            <span className="lp-board-name">{contestant.name}</span>
            {index === 0 && <Crown size={13} className="lp-board-crown" />}
            <span className="lp-board-votes">{contestant.votes.toLocaleString()}</span>
          </div>
        ))}

        <div className="lp-board-foot">Updated just now</div>
      </div>

      <div className="lp-vote">
        <div className="lp-vote-top">
          <span>Cast your vote</span>
          <span className="lp-vote-price">
            ₦50<small>/ vote</small>
          </span>
        </div>
        <div className="lp-vote-row">
          <span>50 votes</span>
          <strong>₦2,500</strong>
        </div>
        <div className="lp-vote-btn">
          Continue <ArrowRight size={14} />
        </div>
      </div>
    </div>
  );
}

export default function StagePickLanding({ onGetStarted }) {
  const handleStart = () => {
    if (onGetStarted) {
      onGetStarted();
      return;
    }

    document.getElementById("start")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="lp-shell">
      <nav className="lp-nav">
        <a className="lp-logo" href="#top">
          StagePick<span className="lp-logo-dot">.</span>
        </a>

        <div className="lp-nav-links">
          <a href="#compare">Why it exists</a>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
        </div>

        <div className="lp-nav-actions">
          <button type="button" className="lp-nav-login" onClick={handleStart}>
            Log in
          </button>
          <button type="button" className="lp-nav-cta" onClick={handleStart}>
            Get started
          </button>
        </div>
      </nav>

      <header className="lp-hero" id="top">
        <div className="lp-wrap lp-hero-inner">
          <div className="lp-hero-copy">
            <div className="lp-eyebrow">
              <span className="lp-dot" />
              Live tally, zero spreadsheets
            </div>

            <h1 className="lp-h1">
              <span className="lp-line">
                <span className="lp-arrow-badge" aria-hidden="true">
                  <ArrowRight size={30} strokeWidth={2.4} />
                </span>
                where the crowd
              </span>
              <span className="lp-line">
                decides — <span className="lp-highlight">live.</span>
                <span className="lp-dots" aria-hidden="true">
                  <i className="blue" />
                  <em>×</em>
                  <i className="green" />
                </span>
              </span>
            </h1>

            <p className="lp-sub">
              Run pageants, talent shows, and competitions with free and paid voting,
              real-time leaderboards, and zero WhatsApp counting.
            </p>

            <div className="lp-hero-ctas">
              <button type="button" className="lp-btn-primary" onClick={handleStart}>
                Start a contest
                <ArrowRight size={16} />
              </button>

              <button type="button" className="lp-btn-link" onClick={() => scrollTo("how")}>
                See how it works
              </button>
            </div>

            <div className="lp-proof">
              <span>Paystack payments</span>
              <i />
              <span>Google sign-in</span>
              <i />
              <span>CSV export</span>
            </div>
          </div>

          <HeroArt />
        </div>
      </header>

      <section className="lp-section" id="compare">
        <div className="lp-wrap">
          <div className="lp-label">The old way</div>
          <h2 className="lp-h2">
            Manual counting doesn't scale past your third contestant.
          </h2>
          <p className="lp-lede">
            Organisers currently run votes through group chats, tallying screenshots by
            hand, trusting whoever is holding the notebook, and hoping no one double-votes.
          </p>

          <div className="lp-compare">
            <div className="lp-compare-card bad">
              <span className="lp-compare-tag bad">WhatsApp counting</span>
              <ul>
                {[
                  "Votes counted by hand from chat logs",
                  "No way to stop duplicate votes",
                  "Results disputed after the show",
                  "Paid votes tracked in a separate spreadsheet",
                  "Audience can't see live standings",
                ].map((item) => (
                  <li key={item}>
                    <span className="lp-compare-mark">
                      <X size={12} strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lp-compare-card good">
              <span className="lp-compare-tag good">StagePick</span>
              <ul>
                {[
                  "Votes counted automatically, in real time",
                  "Free and paid votes, both enforced server-side",
                  "A public, timestamped result every time",
                  "Buy any quantity of votes — total shown up front",
                  "Live leaderboard your audience can watch",
                ].map((item) => (
                  <li key={item}>
                    <span className="lp-compare-mark">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section" id="features">
        <div className="lp-wrap">
          <div className="lp-label">What you get</div>
          <h2 className="lp-h2">
            Everything the notebook and the group chat were doing for you — done properly.
          </h2>

          <div className="lp-features">
            {FEATURES.map(([num, title, body, variant]) => (
              <div className="lp-feature" key={num}>
                <GeoMark variant={variant} />
                <div className="lp-num">{num}</div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" id="how">
        <div className="lp-wrap">
          <div className="lp-label">How it works</div>
          <h2 className="lp-h2">Set up before the show starts. Runs itself once it does.</h2>

          <div className="lp-steps">
            {[
              [
                "1",
                "Create the contest",
                "Add your contestants, decide whether voting is free, paid, or both, and set your price per vote.",
              ],
              [
                "2",
                "Share one link",
                "Post it wherever your audience already is — Instagram bio, WhatsApp status, the emcee reads it on stage.",
              ],
              [
                "3",
                "Votes count themselves",
                "Free votes go straight through. Paid votes show the total before payment, then credit instantly.",
              ],
              [
                "4",
                "Close and export",
                "End the round on schedule and download the full result — every vote, timestamped, ready if anyone asks.",
              ],
            ].map(([idx, title, body]) => (
              <div className="lp-step" key={idx}>
                <div className="lp-step-index">{idx}</div>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" id="pricing">
        <div className="lp-wrap">
          <div className="lp-label">Pricing</div>
          <h2 className="lp-h2">You set the price per vote. We just count them correctly.</h2>
          <p className="lp-lede">
            StagePick doesn't take a cut of your voting price — you decide what a vote costs,
            if anything.
          </p>

          <div className="lp-pricing-row">
            <div className="lp-price-card">
              <span className="lp-price-blob green" aria-hidden="true" />
              <h3>Free voting</h3>
              <div className="lp-price">NGN 0</div>
              <p>
                Every voter gets a set number of free votes, enforced per account. Good for
                smaller shows or a first round.
              </p>
            </div>
            <div className="lp-price-card">
              <span className="lp-price-blob yellow" aria-hidden="true" />
              <h3>Paid voting</h3>
              <div className="lp-price">You set it</div>
              <p>
                Charge per vote, any amount. Voters can buy as many as they want — the total is
                always shown before they pay.
              </p>
            </div>
            <div className="lp-price-card">
              <span className="lp-price-blob blue" aria-hidden="true" />
              <h3>Both, together</h3>
              <div className="lp-price">Your call</div>
              <p>Run free and paid voting side by side in the same event — most pageants do exactly this.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-final" id="start">
        <span className="lp-final-shape circle" aria-hidden="true" />
        <span className="lp-final-shape quarter" aria-hidden="true" />
        <span className="lp-final-shape triangle" aria-hidden="true" />
        <span className="lp-final-shape pill" aria-hidden="true" />

        <div className="lp-label">Ready when you are</div>
        <h2 className="lp-h2">Your next show doesn't need a notebook.</h2>
        <p className="lp-lede">
          Set up your first contest in under ten minutes — free voting included, paid voting optional.
        </p>
        <div className="lp-hero-ctas">
          <button type="button" className="lp-btn-primary" onClick={handleStart}>
            Start a contest — free
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-logo">
            StagePick<span className="lp-logo-dot">.</span>
          </div>
          <div className="lp-foot-links">
            <a href="#compare">Why it exists</a>
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
          </div>
          <div className="lp-foot-links">Copyright 2026 StagePick</div>
        </div>
      </footer>
    </div>
  );
}
