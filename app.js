/* Donation Booth Attendants
 * Plain JS, no build step. Shift data lives in Supabase (table "signups").
 */

/* ---------- Questions (add one entry to add a question) ----------
 * group: heading the card appears under
 * q:     the question, shown in bold
 * a:     the answer
 * note:  optional second line in muted text
 * links: optional list of keys from LINKS below, shown as buttons
 */
const QUESTIONS = [
  {
    group: "From the instructions",
    q: "“How much should I donate?”",
    a: "That is a personal decision. Every donation is appreciated, whatever the amount. (Luke 21:1-4; 2 Cor. 9:7)",
  },
  {
    group: "From the instructions",
    q: "“Can I give you cash or a check?”",
    a: "Not at the booth. Point them to the nearest contribution box.",
  },
  {
    group: "From the instructions",
    q: "“Can you just do it for me on your phone?”",
    a: "No. Help them on their own phone, or let them know a trusted brother or sister in their congregation can help later.",
  },
  {
    group: "From the instructions",
    q: "“I’m not sure if I have a jw.org account.”",
    a: "Open the Log In page on jw.org and use “Trouble Logging In?” to check. If they have none, “Create New Account” is on the same page. They type their own password.",
    links: ["login"],
  },
  {
    group: "From past assemblies",
    q: "“If I write a check, who do I make it out to?”",
    a: "It is on donate.jw.org: tap More Ways, then Check. The page shows the name to write on the check, Watchtower Bible and Tract Society of New York, Inc., and the mailing address.",
    note: "Remember: no checks at the booth.",
    links: ["check"],
  },
];

/* ---------- Links to the real pages (open in a new tab) ---------- */
const LINKS = {
  donate:  { label: "Open donate.jw.org",   href: "https://donate.jw.org/en/USA/home" },
  moreWays:{ label: "Open More Ways",       href: "https://donate.jw.org/en/USA/more-ways-to-donate" },
  check:   { label: "Open the Check page",  href: "https://donate.jw.org/en/USA/more-ways-to-donate/e342dc27-b9d0-401d-9e94-5839aacbb87a/WW" },
  contact: { label: "Open Contact Us",      href: "https://donate.jw.org/en/USA/contact-us" },
  help:    { label: "Open Online Help",     href: "https://donate.jw.org/en/help/online-donations" },
  login:   { label: "Open jw.org Log In",   href: "https://hub.jw.org/home/en" },
};

/* ---------- Shifts ---------- */
const SHIFTS = [
  { id: "s1", time: "8:00 – 8:50",    label: "Before the program" },
  { id: "s2", time: "8:50 – 9:40",    label: "Before the program" },
  { id: "s3", time: "12:00 – 12:45",  label: "Lunch" },
  { id: "s4", time: "12:45 – 1:30",   label: "Lunch" },
  { id: "s5", time: "3:55 – closing", label: "After the program" },
];
const SLOTS_PER_SHIFT = 2;

/* ---------- Supabase ---------- */
const SUPABASE_URL = "https://xyrjphthjlknusptimfr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cmpwaHRoamxrbnVzcHRpbWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5NDE2NTcsImV4cCI6MjExMDUxNzY1N30.u_ejyDthcIGiof1c0yRSHnmY_HWkSSz_hBEf5x5tBH4";
const POLL_MS = 20000;
const NAME_KEY = "dba-name";

/* ================================================================ */

const $ = (sel, root = document) => root.querySelector(sel);

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

const SVG_NS = "http://www.w3.org/2000/svg";
function svg(paths, cls, viewBox = "0 0 24 24") {
  const s = document.createElementNS(SVG_NS, "svg");
  s.setAttribute("viewBox", viewBox);
  s.setAttribute("aria-hidden", "true");
  s.setAttribute("focusable", "false");
  if (cls) s.setAttribute("class", cls);
  for (const p of paths) {
    const node = document.createElementNS(SVG_NS, p.tag || "path");
    for (const [k, v] of Object.entries(p)) if (k !== "tag") node.setAttribute(k, v);
    s.append(node);
  }
  return s;
}

const externalIcon = () =>
  svg([{ d: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" }]);

const xIcon = () =>
  svg([
    { tag: "circle", cx: "12", cy: "12", r: "11", fill: "#8A3A00" },
    { d: "M8 8l8 8M16 8l-8 8", fill: "none", stroke: "#fff", "stroke-width": "2.4", "stroke-linecap": "round" },
  ], "x-icon");

function linkButton(key) {
  const link = LINKS[key] || LINKS.donate;
  return el("a", { class: "link-btn", href: link.href, target: "_blank", rel: "noopener" },
    link.label, externalIcon(), el("span", { class: "sr-only" }, " (opens in a new tab)"));
}

/* ---------- Tabs ---------- */
const TAB_NAMES = ["shifts", "instructions", "questions"];

function showTab() {
  const name = location.hash.replace("#", "");
  const active = TAB_NAMES.includes(name) ? name : "shifts";
  document.querySelectorAll("[data-panel]").forEach((p) => { p.hidden = p.dataset.panel !== active; });
  document.querySelectorAll("[data-tab]").forEach((t) => {
    if (t.dataset.tab === active) t.setAttribute("aria-current", "page");
    else t.removeAttribute("aria-current");
  });
}

function initTabs() {
  window.addEventListener("hashchange", () => { showTab(); window.scrollTo(0, 0); });
  showTab();
}

/* ---------- Static content ---------- */
function renderLinkRows() {
  document.querySelectorAll("[data-links]").forEach((row) => {
    row.replaceChildren(...row.dataset.links.split(",").map((k) => linkButton(k.trim())));
  });
  document.querySelectorAll(".x-list li").forEach((li) => li.prepend(xIcon()));
}

function renderQuestions() {
  const list = $("#question-list");
  const nodes = [];
  let lastGroup = null;
  for (const item of QUESTIONS) {
    if (item.group && item.group !== lastGroup) {
      nodes.push(el("p", { class: "group-label" }, item.group));
      lastGroup = item.group;
    }
    nodes.push(el("div", { class: "card" },
      el("h3", { class: "q-title" }, item.q),
      el("p", {}, item.a),
      item.note ? el("p", { class: "q-note" }, item.note) : null,
      item.links && item.links.length ? el("div", { class: "link-row" }, item.links.map(linkButton)) : null,
    ));
  }
  list.replaceChildren(...nodes);
}

/* ---------- Name (remembered on this phone) ---------- */
const nameInput = () => $("#name-input");

function loadName() {
  try { return localStorage.getItem(NAME_KEY) || ""; } catch { return ""; }
}
function saveName(v) {
  try { localStorage.setItem(NAME_KEY, v); } catch { /* storage blocked: fine */ }
}
const typedName = () => nameInput().value.trim().replace(/\s+/g, " ");
const sameName = (a, b) => a && b && a.trim().toLowerCase() === b.trim().toLowerCase();

/* ---------- Shift state ---------- */
let db = null;
let rows = [];            // signups from the database
let loaded = false;
let loadFailed = false;
let confirming = null;    // signup id while its remove box is open
let busy = new Set();     // spots with a request in flight
let noticeTimer = null;

const key = (shift, slot) => `${shift}:${slot}`;
const rowFor = (shift, slot) => rows.find((r) => r.shift_id === shift && r.slot === slot);

function showNotice(text) {
  const n = $("#shift-notice");
  n.textContent = text;
  n.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { n.hidden = true; }, 6000);
}

async function fetchRows() {
  if (!db) throw new Error("Database client not available");
  const { data, error } = await db
    .from("signups")
    .select("id, shift_id, slot, name, created_at")
    .order("created_at");
  if (error) throw error;
  return data;
}

let lastSignature = null;  // what is on screen now, so background refreshes don't redraw for nothing

async function refresh({ force = false } = {}) {
  try {
    rows = await fetchRows();
    loaded = true;
    loadFailed = false;
  } catch (err) {
    console.error("Load failed", err);
    if (!loaded) loadFailed = true; // keep showing the last good data if we had some
  }
  const signature = loadFailed ? "failed" : JSON.stringify(rows.map((r) => [r.id, r.shift_id, r.slot, r.name]));
  // Redrawing replaces the buttons, which can swallow a tap in progress. Only redraw on a real change.
  if (!force && signature === lastSignature) return;
  if (confirming && !rows.some((r) => r.id === confirming)) confirming = null;
  lastSignature = signature;
  renderShifts();
}

function renderShifts() {
  const list = $("#shift-list");
  const left = $("#spots-left");

  if (loadFailed) {
    left.textContent = "";
    list.replaceChildren(el("div", { class: "card error-card" },
      el("p", {}, "Couldn't load the shifts. Tap to try again."),
      el("button", { type: "button", class: "btn btn-primary", onclick: retryLoad }, "Try again"),
    ));
    return;
  }
  if (!loaded) return;

  const total = SHIFTS.length * SLOTS_PER_SHIFT;
  const filled = SHIFTS.reduce((n, s) => n + [0, 1].filter((i) => rowFor(s.id, i)).length, 0);
  const open = total - filled;
  left.textContent = open === 0 ? "Every spot is filled" : `${open} of ${total} spots still open`;

  const me = typedName();
  list.replaceChildren(...SHIFTS.map((s) => {
    const spots = [];
    for (let i = 0; i < SLOTS_PER_SHIFT; i++) spots.push(renderSpot(s, i, me));
    return el("div", { class: "card shift-card" },
      el("div", { class: "shift-head" },
        el("h3", { class: "shift-time" }, s.time),
        el("span", { class: "shift-label" }, s.label),
      ),
      el("div", { class: "spots" }, spots),
    );
  }));
}

function renderSpot(shift, slot, me) {
  const k = key(shift.id, slot);
  const row = rowFor(shift.id, slot);
  const isBusy = busy.has(k);

  if (!row) {
    return el("button", {
      type: "button", class: "spot-open", disabled: isBusy,
      "aria-label": `Open spot ${slot + 1}, ${shift.time}. Tap to take this spot.`,
      onclick: () => takeSpot(shift, slot),
    }, isBusy ? "Saving…" : "Open · tap to take this spot");
  }

  if (confirming === row.id) {
    return el("div", { class: "confirm-box", role: "group", "aria-label": "Confirm remove" },
      el("p", {}, `Remove ${row.name} from this shift?`),
      el("div", { class: "confirm-actions" },
        el("button", { type: "button", class: "btn btn-danger", disabled: isBusy, onclick: () => removeSpot(shift, slot, row) },
          isBusy ? "Removing…" : "Yes, remove"),
        el("button", { type: "button", class: "btn btn-quiet", disabled: isBusy, onclick: () => { confirming = null; renderShifts(); } }, "Keep"),
      ),
    );
  }

  const mine = sameName(row.name, me);
  return el("div", { class: "spot-filled" + (mine ? " is-you" : "") },
    el("span", { class: "spot-name" }, row.name, mine ? el("span", { class: "you-tag" }, " (you)") : null),
    el("button", {
      type: "button", class: "remove-btn",
      "aria-label": `Remove ${row.name} from ${shift.time}`,
      onclick: () => { confirming = row.id; renderShifts(); focusConfirm(); },
    }, "Remove"),
  );
}

function focusConfirm() {
  const btn = $(".confirm-box .btn-quiet");
  if (btn) btn.focus();
}

async function takeSpot(shift, slot) {
  const name = typedName();
  const err = $("#name-error");
  if (!name) {
    err.hidden = false;
    nameInput().focus();
    return;
  }
  err.hidden = true;
  saveName(name);

  const k = key(shift.id, slot);
  busy.add(k);
  renderShifts();
  const { error } = await db.from("signups").insert({ shift_id: shift.id, slot, name });
  busy.delete(k);
  if (error) {
    console.error("Insert failed", error);
    if (error.code === "23505") showNotice("Someone just took that spot.");
    else showNotice("Couldn't save that. Check your connection and try again.");
  }
  await refresh({ force: true });
}

async function removeSpot(shift, slot, row) {
  const k = key(shift.id, slot);
  busy.add(k);
  renderShifts();
  const { error } = await db.from("signups").delete().eq("id", row.id);
  busy.delete(k);
  confirming = null;
  if (error) {
    console.error("Delete failed", error);
    showNotice("Couldn't remove that. Check your connection and try again.");
  }
  await refresh({ force: true });
}

async function retryLoad() {
  $("#shift-list").replaceChildren(el("div", { class: "card loading" }, "Loading shifts…"));
  if (!db) initClient();
  await refresh({ force: true });
}

function initClient() {
  try {
    if (window.supabase && SUPABASE_URL.startsWith("https://")) {
      db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      db.channel("signups-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "signups" }, () => refresh())
        .subscribe();
    }
  } catch (err) {
    console.error("Supabase init failed", err);
    db = null;
  }
}

function initShifts() {
  const input = nameInput();
  input.value = loadName();
  input.addEventListener("input", () => {
    saveName(input.value.trim());
    if (input.value.trim()) $("#name-error").hidden = true;
    if (loaded) renderShifts();
  });

  initClient();
  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, POLL_MS);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
}

/* ---------- Start ---------- */
renderLinkRows();
renderQuestions();
initTabs();
initShifts();
