// Click-through of the main StagePick voter flows in jsdom.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);

const dom = new JSDOM(
  '<!doctype html><html><body><div id="root"></div></body></html>',
  { url: "http://localhost:5173/?view=home", pretendToBeVisual: true },
);

const { window } = dom;
globalThis.window = window;
globalThis.document = window.document;
Object.defineProperty(globalThis, "navigator", {
  value: window.navigator,
  configurable: true,
});
globalThis.HTMLElement = window.HTMLElement;
globalThis.HTMLInputElement = window.HTMLInputElement;
globalThis.Node = window.Node;
globalThis.Event = window.Event;
globalThis.MouseEvent = window.MouseEvent;
globalThis.getComputedStyle = window.getComputedStyle;
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};

const React = require("react");
const { act } = React;
const { createRoot } = require("react-dom/client");
const organiserCalls = [];
const StagePickApp = require("../.verify/StagePickApp.cjs").default;

const results = [];
function ok(name) {
  results.push(name);
  console.log("PASS", name);
}

const buttons = () => [...document.querySelectorAll("button")];
const btn = (label, root = document) =>
  [...root.querySelectorAll("button")].find((b) =>
    (b.textContent || "").replace(/\s+/g, " ").trim().includes(label),
  );
const text = () => document.body.textContent.replace(/\s+/g, " ");
const exactBtn = (label) =>
  buttons().find((b) => (b.textContent || "").trim() === label);

async function click(el) {
  assert.ok(el, "element to click exists");
  await act(async () => {
    el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  });
  await act(async () => { await Promise.resolve(); });
}

async function type(input, value) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  ).set;
  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
}

async function submit(form) {
  await act(async () => {
    form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  });
}

const root = createRoot(document.getElementById("root"));

await act(async () => {
  root.render(
    React.createElement(StagePickApp, {
      onOpenOrganizer: (wizard) => organiserCalls.push(wizard),
    }),
  );
});
// Wait out the skeleton state.
await act(async () => { await new Promise((r) => setTimeout(r, 500)); });

// 1. Home shell, grouping, create block last.
assert.equal(document.querySelector("h1").textContent, "Live events");
assert.ok(document.querySelector(".sp-sec-live"), "live section");
assert.ok(document.querySelector(".sp-sec-closing"), "closing section");
assert.ok(document.querySelector(".sp-sec-upcoming"), "upcoming section");
assert.ok(document.querySelector(".sp-sec-ended"), "ended section");
assert.equal(document.querySelectorAll(".sp-card").length, 10, "10 public cards");
assert.ok(!text().includes("Startup Pitch Night"), "link-only event is hidden");
const grid = document.querySelector(".sp-grid");
assert.ok(grid.lastElementChild.classList.contains("sp-create"), "create block is last");
ok("home groups public events and keeps Create event last");

// 2. Filter chips.
await click(btn("Upcoming"));
assert.equal(document.querySelectorAll(".sp-card").length, 3);
assert.ok(text().includes("Hackathon Demo Day"));
assert.ok(!text().includes("Campus Talent Night 2026"));
ok("Upcoming filter shows only upcoming events");

await click(btn("Live now"));
assert.equal(document.querySelectorAll(".sp-card").length, 5, "live + closing");
await click(btn("Ended"));
assert.equal(document.querySelectorAll(".sp-card").length, 2);
ok("Live now / Ended counts and filtering");

await click(btn("All"));
assert.equal(document.querySelectorAll(".sp-card").length, 10);
ok("All filter restores every public event");

// 3. Search + empty state + clear.
const search = document.querySelector('input[aria-label="Search events"]');
await type(search, "hackathon");
assert.equal(document.querySelectorAll(".sp-card").length, 1);
await type(search, "zzzz");
assert.ok(document.querySelector(".sp-empty"));
assert.ok(text().includes("No matches"));
await click(btn("Clear filters"));
assert.equal(document.querySelectorAll(".sp-card").length, 10);
ok("search narrows results; empty state clears filters");

// 4. Link box: invalid then link-only event.
const linkForm = document.querySelector(".sp-linkbox");
const linkInput = document.querySelector("#sp-link");
await type(linkInput, "NOPE-123");
await submit(linkForm);
assert.ok(document.querySelector('[role="alert"]').textContent.includes("doesn't match"));
ok("invalid event code shows an inline error");

await type(linkInput, "PITCH26");
await submit(linkForm);
assert.equal(document.querySelector("h1").textContent, "Startup Pitch Night");
assert.ok(text().includes("Private"));
ok("valid code opens the link-only event");

await click(btn("All events"));
assert.equal(document.querySelector("h1").textContent, "Live events");
ok("back link returns to all events");

// 5. Signed-out free vote: prompt, then resume the same vote.
await click(document.querySelector('.sp-card-hit[aria-label="Open Campus Talent Night 2026"]'));
assert.equal(document.querySelector("h1").textContent, "Campus Talent Night 2026");
assert.ok(!text().includes("Private"));
assert.ok(text().includes("1 free vote left"), "sticky bar shows the free vote");
const leaderRow = document.querySelector(".sp-lbrow");
const leaderName = leaderRow.querySelector(".sp-lbname").textContent.trim();
const before = Number(leaderRow.querySelector(".sp-lbvotes").textContent.replace(/,/g, ""));
await click(btn("Vote", leaderRow));
assert.ok(text().includes("Vote for " + leaderName));
await click(btn("Vote Free"));
assert.ok(text().includes("Sign in to vote"), "sign-in prompt appears at vote time");
ok("signed-out voter is asked to sign in only when voting");

await type(document.querySelector("#sp-auth-email"), "ada@example.com");
await type(document.querySelector("#sp-auth-password"), "stagepick123");
await submit(document.querySelector(".sp-auth-form"));
assert.ok(text().includes("Free vote counted for " + leaderName));
const after = Number(
  document.querySelector(".sp-lbrow .sp-lbvotes").textContent.replace(/,/g, ""),
);
assert.equal(after, before + 1, "leaderboard updates in place");
assert.ok(text().includes("You voted for " + leaderName));
assert.ok(text().includes("Free vote used"), "sticky bar flips to used");
ok("sign-in resumes the free vote and updates the leaderboard");

// 6. Free vote used state.
await click(btn("Vote", document.querySelector(".sp-lbrow")));
assert.ok(text().includes("You've used your free vote for this event."));
assert.ok(!btn("Vote Free", document.querySelector(".sp-sheet")));
ok("second free vote is blocked once used");

// 7. Paid flow totals at every step, then cast.
await click(document.querySelector('button[aria-label="Add one vote"]'));
await click(document.querySelector('button[aria-label="Add one vote"]'));
assert.ok(text().includes("₦150"), "total updates with quantity");
await click(btn("Continue to Payment"));
assert.ok(text().includes("3 votes × ₦50"));
assert.ok(text().includes("₦150"));
await click(btn("Pay ₦150"));
assert.ok(text().includes("Payment successful"));
await click(btn("Cast 3 Votes"));
assert.ok(text().includes("3 paid votes counted"));
const paidAfter = Number(
  document.querySelector(".sp-lbrow .sp-lbvotes").textContent.replace(/,/g, ""),
);
assert.equal(paidAfter, before + 4);
ok("paid purchase shows the total at each step and casts 3 votes");

// 8. Ended event is read-only; activity strip lives on home.
await click(btn("All events"));
assert.ok(document.querySelector("#sp-activity"), "activity strip appears after voting");
await click(document.querySelector('.sp-card-hit[aria-label="Open Inter-Faculty Debate"]'));
assert.ok(text().includes("Voting closed"));
assert.ok(text().includes("Final ranking"));
assert.equal(
  [...document.querySelectorAll(".sp-lbrow")].filter((row) => btn("Vote", row)).length,
  0,
  "no vote buttons on ended events",
);
ok("ended event is read-only with a clear closed banner");

// 9. Upcoming events offer a reminder instead of a vote.
await click(btn("All events"));
const hackCard = document.querySelector('article[aria-label="Hackathon Demo Day"]');
const remind = btn("Remind me", hackCard);
assert.ok(remind);
await click(remind);
assert.ok(btn("Reminder set", hackCard));
ok("upcoming events show Remind me, not Vote");

// 10. Organiser dashboard is reachable again from the home menu.
await click(document.querySelector('button[aria-label="Open menu"]'));
await click(exactBtn("Organiser dashboard"));
assert.deepEqual(organiserCalls, [false], "menu opens the organiser dashboard");
await click(document.querySelector('button[aria-label="Open menu"]'));
await click(exactBtn("Create an event"));
assert.deepEqual(organiserCalls, [false, true], "menu create opens the wizard");
await click(btn("Create event"));
assert.deepEqual(organiserCalls, [false, true, true], "create block opens the wizard");
ok("organiser dashboard and create wizard are reachable again");

// 11. Layout + theme guards.
const css = document.querySelector("style").textContent;
assert.ok(css.includes("--paper:#f3f1e9"), "landing paper palette");
assert.ok(css.includes("--ink:#14131a"), "landing ink palette");
assert.ok(css.includes("font-family:'Manrope'"), "landing typeface");
assert.ok(css.includes("min-width:1024px"), "wide-screen layout media query");
assert.ok(css.includes("repeat(2,minmax(0,1fr))"), "two-up event cards on desktop");
assert.ok(css.includes("prefers-reduced-motion"));
assert.ok(css.includes("overflow-x:auto"));
ok("landing theme, desktop grid and reduced-motion rules are present");

// 12. Email + password sign-in, profile, sign-out.
await act(async () => { root.unmount(); });

const authEvents = [];
const signInMock = ({ mode, email, password }) => {
  authEvents.push(mode);
  if (email.trim().toLowerCase() !== "alex@example.com") {
    return { ok: false, error: "No account uses that email yet. Create one instead." };
  }
  if (password !== "stagepick123") {
    return { ok: false, error: "That password doesn't match. Try again." };
  }
  return {
    ok: true,
    account: { name: "Alex Morgan", email, joined: "Member since March 2025" },
  };
};

const root2 = createRoot(document.getElementById("root"));
await act(async () => {
  root2.render(React.createElement(StagePickApp, { onSignIn: signInMock }));
});
await act(async () => { await new Promise((r) => setTimeout(r, 500)); });

await click(document.querySelector('.sp-card-hit[aria-label="Open Campus Talent Night 2026"]'));
await click(btn("Vote", document.querySelector(".sp-lbrow")));
await click(btn("Vote Free"));
assert.ok(document.querySelector("#sp-auth-email"), "email field in the sign-in sheet");
assert.ok(document.querySelector("#sp-auth-password"), "password field in the sign-in sheet");

await type(document.querySelector("#sp-auth-email"), "alex@example.com");
await type(document.querySelector("#sp-auth-password"), "wrongpass1");
await submit(document.querySelector(".sp-auth-form"));
assert.ok(
  document.querySelector(".sp-auth-error").textContent.includes("password"),
  "wrong password shows an inline error",
);
assert.ok(document.querySelector("#sp-auth-password"), "sheet stays open after a failure");
ok("wrong password is rejected with an inline error");

await type(document.querySelector("#sp-auth-password"), "stagepick123");
await submit(document.querySelector(".sp-auth-form"));
assert.ok(!document.querySelector(".sp-auth-form"), "sheet closes after a successful sign-in");
assert.ok(text().includes("Free vote counted"), "the pending vote resumes after sign-in");
assert.deepEqual(authEvents, ["signin", "signin"]);
ok("correct email + password signs in and resumes the pending vote");

await click(btn("All events"));
await click(document.querySelector('button[aria-label="Open menu"]'));
await click(exactBtn("My profile"));
assert.ok(document.querySelector(".sp-profile"), "profile screen opens");
assert.ok(text().includes("Alex Morgan"), "profile shows the name");
assert.ok(text().includes("alex@example.com"), "profile shows the email");
assert.ok(text().includes("Member since March 2025"), "profile shows the join date");
assert.equal(document.querySelectorAll(".sp-stat").length, 4, "four profile stats");
assert.ok(document.querySelector(".sp-history-row"), "vote history row");
ok("profile shows account details, stats and vote history");

await act(async () => {
  window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape" }));
});
assert.ok(!document.querySelector(".sp-profile"), "Escape returns from the profile");
await click(document.querySelector('button[aria-label="Open menu"]'));
await click(exactBtn("My profile"));
assert.ok(document.querySelector(".sp-profile"), "profile reopens");
ok("Escape closes the profile screen");

await click(exactBtn("Sign out"));
assert.ok(!document.querySelector(".sp-profile"), "profile closes on sign-out");
await click(document.querySelector('button[aria-label="Open menu"]'));
assert.ok(exactBtn("Sign in"), "menu offers sign-in after sign-out");
await click(exactBtn("My profile"));
assert.ok(document.querySelector(".sp-auth-form"), "profile while signed out opens sign-in");
ok("sign out clears the session and guards the profile");

// 13. Credential store rules (shared by the landing form and the vote sheet).
const { checkCredentials, DEMO_ACCOUNT } = await import("../src/authStore.js");
const store = [DEMO_ACCOUNT];
const wrongPass = checkCredentials(store, {
  mode: "signin",
  email: "alex@example.com",
  password: "nope1234",
});
assert.equal(wrongPass.ok, false);
assert.match(wrongPass.error, /password/i);
const unknown = checkCredentials(store, {
  mode: "login",
  email: "nobody@example.com",
  password: "stagepick123",
});
assert.equal(unknown.ok, false);
assert.match(unknown.error, /no account/i);
const good = checkCredentials(store, {
  mode: "signin",
  email: "Alex@Example.com",
  password: "stagepick123",
});
assert.equal(good.ok, true);
assert.equal(good.account.name, "Alex Morgan");
assert.equal(good.account.password, undefined, "password never leaves the store");
const signup = checkCredentials(store, {
  mode: "signup",
  name: "Ada Obi",
  email: "ada@example.com",
  password: "password123",
});
assert.equal(signup.ok, true);
const loginAgain = checkCredentials([...store, signup.created], {
  mode: "login",
  email: "ada@example.com",
  password: "password123",
});
assert.equal(loginAgain.ok, true);
assert.equal(loginAgain.account.name, "Ada Obi");
const duplicate = checkCredentials([...store, signup.created], {
  mode: "signup",
  name: "Ada Again",
  email: "ada@example.com",
  password: "password123",
});
assert.equal(duplicate.ok, false);
assert.match(duplicate.error, /already exists/i);
ok("credential store rejects bad passwords and accepts a fresh sign-up");

await act(async () => { root2.unmount(); });
dom.window.close();

console.log("\n" + results.length + " flow checks passed.");
