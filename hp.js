// hp.js — Harry Potter Wedding Site
// Vanilla ES module. No dependencies.

// ══════════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════════

const PASSWORD = "wedding";

const HP_HAS_VISITED_KEY    = "HP_HAS_VISITED";
const HP_LOCKOUT_UNTIL_KEY  = "HP_LOCKOUT_UNTIL";
const HP_FIRST_RSVP_SEEN_KEY = "HP_FIRST_RSVP_SEEN";
const HP_MAP_PLAYED_KEY     = "HP_MAP_PLAYED";
const HP_MUSIC_MUTED_KEY    = "HP_MUSIC_MUTED";

const MAX_PASSWORD_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS   = 24 * 60 * 60 * 1000;

const TALLY_EMBED_SCRIPT = "https://tally.so/widgets/embed.js";

// Weasley clock data (mirrors index.js)
const CLOCK_FACE_ANGLES = { work: 0, gym: 60, yoga: 120, toilet: 180, bed: 240, desk: 300 };
const HW_CLOCK_ROUTE = [
  { name: "Work",  slug: "work"  },
  { name: "Gym",   slug: "gym"   },
  { name: "Yoga",  slug: "yoga"  },
  { name: "Bed",   slug: "bed"   },
];
const JOEL_CLOCK_ROUTE = [
  { name: "Work",   slug: "work"   },
  { name: "Toilet", slug: "toilet" },
  { name: "Bed",    slug: "bed"    },
  { name: "Desk",   slug: "desk"   },
];
const HW_CLOCK_NOTES = {
  work:   "6am up at it em",
  gym:    "💪💪🔥🔥",
  yoga:   "Namaste",
  bed:    "Nuaaaaaaaa",
};
const JOEL_CLOCK_NOTES = {
  work:   "9am still not up",
  toilet: "Full of crap",
  desk:   "Gaming. Losing. Crying.",
  bed:    "Snoreeeeeee",
};

const CLOCK_CYCLE_INTERVAL_MIN = 2000;
const CLOCK_CYCLE_INTERVAL_MAX = 2500;

// Map animation constants (matches index.js)
const MAP_STROKE_DASH     = 2400;
const MAP_INTRO_DURATION  = 1420;
const MAP_REVEAL_DURATION = 2880;
const MAP_BLANK_DELAY     = 800;
const MAP_QUILL_OFFSET_X  = 18;
const MAP_QUILL_OFFSET_Y  = 46;

// Spell easter eggs
const SPELL_BUFFER_SIZE = 12;
const SPELLS = {
  lumos: "lumos",
  nox:   "nox",
};

// ══════════════════════════════════════════════════════════
// DOM refs
// ══════════════════════════════════════════════════════════

const gateScreen       = document.querySelector("[data-gate-screen]");
const fatLadyText      = document.querySelector("[data-fat-lady-text]");
const passwordForm     = document.querySelector("[data-password-form]");
const passwordInput    = document.querySelector("[data-password-input]");
const passwordError    = document.querySelector("[data-password-error]");
const lockoutMessage   = document.querySelector("[data-lockout-message]");
const doorSwing        = document.querySelector("[data-door-swing]");
const roomScreen       = document.querySelector("[data-room-screen]");
const roomBlurOverlay  = document.querySelector("[data-room-blur-overlay]");
const roomItems        = Array.from(document.querySelectorAll("[data-room-item]"));

// Owl intro (first-time)
const owlIntro         = document.querySelector("[data-owl-intro]");
const owlIntroOwl      = document.querySelector("[data-owl-intro-owl]");
const owlIntroEnvelope = document.querySelector("[data-owl-intro-envelope]");

// Panels
const panels           = Array.from(document.querySelectorAll("[data-panel]"));
const panelCloseButtons = Array.from(document.querySelectorAll("[data-panel-close]"));

// Clock panel refs
const specialClock     = document.querySelector("[data-special-clock]");
const clockLabels      = Array.from(document.querySelectorAll("[data-clock-place]"));
const hwClockHand      = document.querySelector('[data-clock-hand="hw"]');
const joelClockHand    = document.querySelector('[data-clock-hand="joel"]');
const hwClockStatus    = document.querySelector('[data-clock-status="hw"]');
const joelClockStatus  = document.querySelector('[data-clock-status="joel"]');
const hwClockNote      = document.querySelector('[data-clock-note="hw"]');
const joelClockNote    = document.querySelector('[data-clock-note="joel"]');

// Map panel refs
const mapPanel         = document.querySelector('[data-panel="map"]');
const mapSurface       = document.querySelector("[data-map-surface]");
const mapIntroStage    = document.querySelector("[data-map-intro-stage]");
const mapWritingStage  = document.querySelector("[data-map-writing-stage]");
const mapBlankStage    = document.querySelector("[data-map-blank-stage]");
const mapSpellSvg      = document.querySelector("[data-map-spell-svg]");
const mapLineTexts     = Array.from(document.querySelectorAll("[data-map-line-text]"));
const mapQuill         = document.querySelector("[data-map-quill]");
const replayMapBtn     = document.querySelector("[data-replay-map]");

// RSVP panel refs
const rsvpPanel        = document.querySelector('[data-panel="rsvp"]');
const owlRsvpAnim      = document.querySelector("[data-owl-rsvp-anim]");
const owlRsvpOwl       = document.querySelector("[data-owl-rsvp-owl]");

// Music
const musicToggle      = document.querySelector("[data-music-toggle]");
const bgmTracks = {
  room:     document.getElementById("bgm-room"),
  pensieve: document.getElementById("bgm-pensieve"),
  clock:    document.getElementById("bgm-clock"),
  map:      document.getElementById("bgm-map"),
  rsvp:     document.getElementById("bgm-rsvp"),
};

// Candles
const candles          = Array.from(document.querySelectorAll("[data-candle]"));

// Wand canvas
const wandCanvas       = document.querySelector("[data-wand-canvas]");
const ctx              = wandCanvas ? wandCanvas.getContext("2d") : null;

// ══════════════════════════════════════════════════════════
// State
// ══════════════════════════════════════════════════════════

let passwordAttempts  = 0;
let activePanel       = null;
let isMusicMuted      = true;
let currentBgmKey     = null;
let isLumos           = false;
let spellBuffer       = "";

// Clock state
let activeHwClockIndex   = 0;
let activeJoelClockIndex = 0;
let hwClockTimeoutId     = null;
let joelClockTimeoutId   = null;

// Map state
let mapAnimationFrameId = null;
let mapBlankTimeoutId   = null;
let mapIntroTimeoutId   = null;
let mapRevealStartedAt  = 0;
let mapLineMetrics      = [];

// Tally
let tallyEmbedLoadPromise = null;

// Wand particles
let particles = [];
let mouseX = 0;
let mouseY = 0;

// ══════════════════════════════════════════════════════════
// localStorage helpers
// ══════════════════════════════════════════════════════════

function lsGet(key) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

function lsSet(key, value) {
  try { window.localStorage.setItem(key, String(value)); } catch { /* ignore */ }
}

function lsRemove(key) {
  try { window.localStorage.removeItem(key); } catch { /* ignore */ }
}

function hasVisited()       { return lsGet(HP_HAS_VISITED_KEY) === "true"; }
function markVisited()      { lsSet(HP_HAS_VISITED_KEY, "true"); }
function hasSeenFirstRsvp() { return lsGet(HP_FIRST_RSVP_SEEN_KEY) === "true"; }
function markFirstRsvp()    { lsSet(HP_FIRST_RSVP_SEEN_KEY, "true"); }
function hasMapPlayed()     { return lsGet(HP_MAP_PLAYED_KEY) === "true"; }
function markMapPlayed()    { lsSet(HP_MAP_PLAYED_KEY, "true"); }
function clearMapPlayed()   { lsRemove(HP_MAP_PLAYED_KEY); }

function getLockoutUntil() {
  const v = lsGet(HP_LOCKOUT_UNTIL_KEY);
  return v ? parseInt(v, 10) : 0;
}

function setLockout() {
  lsSet(HP_LOCKOUT_UNTIL_KEY, Date.now() + LOCKOUT_DURATION_MS);
}

function isLockedOut() {
  const until = getLockoutUntil();
  return until > 0 && Date.now() < until;
}

// ══════════════════════════════════════════════════════════
// Fat Lady typewriter
// ══════════════════════════════════════════════════════════

function typeText(element, text, speedMs = 42) {
  return new Promise((resolve) => {
    element.textContent = "";
    let i = 0;
    const tick = () => {
      element.textContent += text[i];
      i++;
      if (i < text.length) {
        setTimeout(tick, speedMs);
      } else {
        resolve();
      }
    };
    setTimeout(tick, speedMs);
  });
}

// ══════════════════════════════════════════════════════════
// Gate screen
// ══════════════════════════════════════════════════════════

function showGateScreen() {
  if (!gateScreen) return;
  gateScreen.hidden = false;

  if (isLockedOut()) {
    showLockout();
    return;
  }

  // Typewriter greeting, then show form
  typeText(fatLadyText, "Welcome sorcerer, are you ready?").then(() => {
    if (passwordForm) {
      passwordForm.hidden = false;
      passwordInput?.focus();
    }
  });
}

function showLockout() {
  if (passwordForm) passwordForm.hidden = true;
  if (lockoutMessage) lockoutMessage.hidden = false;
}

function showPasswordError(message) {
  if (!passwordError) return;
  passwordError.textContent = message;
  passwordError.hidden = false;
  // Re-trigger shake animation
  passwordError.style.animation = "none";
  // Force reflow
  void passwordError.offsetHeight;
  passwordError.style.animation = "";
}

function hidePasswordError() {
  if (!passwordError) return;
  passwordError.hidden = true;
  passwordError.textContent = "";
}

async function handlePasswordSubmit(event) {
  event.preventDefault();
  if (!passwordInput) return;

  const value = passwordInput.value.trim().toLowerCase();

  if (value !== PASSWORD) {
    passwordAttempts++;
    passwordInput.value = "";

    if (passwordAttempts >= MAX_PASSWORD_ATTEMPTS) {
      setLockout();
      await typeText(fatLadyText, "You shall not pass! Come back tomorrow.");
      showLockout();
      return;
    }

    await typeText(fatLadyText, "Oh no! That's not the password, try again!");
    showPasswordError(`${MAX_PASSWORD_ATTEMPTS - passwordAttempts} attempt(s) remaining`);
    passwordInput.focus();
    return;
  }

  // Correct
  hidePasswordError();
  markVisited();
  await typeText(fatLadyText, "Very well… enter.");
  openDoor();
}

// ══════════════════════════════════════════════════════════
// Door swing → room reveal
// ══════════════════════════════════════════════════════════

function openDoor() {
  // Animate fat lady portrait swinging open
  const portrait = document.querySelector(".fatLadyPortrait");
  if (portrait) {
    portrait.classList.add("is-swinging");
  }

  // Show door swing halves
  if (doorSwing) {
    doorSwing.hidden = false;
    // Slight delay so portrait swing plays first
    setTimeout(() => {
      doorSwing.classList.add("is-open");
    }, 200);
  }

  // After door animation completes (900ms + 200ms delay = ~1200ms),
  // hide gate, show room
  setTimeout(() => {
    if (gateScreen) gateScreen.hidden = true;
    if (doorSwing)  doorSwing.hidden = true;
    doorSwing?.classList.remove("is-open");

    showRoom();
  }, 1300);
}

function showRoom() {
  if (!roomScreen) return;
  roomScreen.hidden = false;
  roomScreen.classList.add("is-entering");
  roomScreen.addEventListener(
    "animationend",
    () => roomScreen.classList.remove("is-entering"),
    { once: true }
  );

  // Start room BGM
  playBgm("room");

  // First-time RSVP intro (after room animation ~800ms)
  if (!hasSeenFirstRsvp()) {
    setTimeout(() => {
      startOwlIntro();
    }, 900);
  }
}

// ══════════════════════════════════════════════════════════
// First-time owl intro
// ══════════════════════════════════════════════════════════

function startOwlIntro() {
  if (!owlIntro) return;
  owlIntro.hidden = false;
  owlIntro.classList.add("is-flying");

  // Owl lands ~1200ms in, then drop envelope
  setTimeout(() => {
    owlIntro.classList.remove("is-flying");
    if (owlIntroEnvelope) {
      owlIntroEnvelope.hidden = false;
      owlIntro.classList.add("is-dropping");
    }
  }, 1200);

  // Open envelope flap after it lands (~600ms drop)
  setTimeout(() => {
    owlIntro.classList.remove("is-dropping");
    const flap = owlIntroEnvelope?.querySelector("[data-envelope-flap]");
    if (flap) flap.classList.add("is-open");

    // Load Tally inside the intro envelope
    loadTallyEmbeds();
    markFirstRsvp();
  }, 1900);
}

// Called when user submits RSVP (or closes intro envelope)
function closeOwlIntro() {
  if (!owlIntro) return;
  // Close flap
  const flap = owlIntroEnvelope?.querySelector("[data-envelope-flap]");
  if (flap) flap.classList.remove("is-open");

  // Short delay, then owl grabs and flies out
  setTimeout(() => {
    if (owlIntroEnvelope) owlIntroEnvelope.hidden = true;
    owlIntro.classList.add("is-flying-out");

    setTimeout(() => {
      owlIntro.hidden = true;
      owlIntro.classList.remove("is-flying-out");
    }, 1100);
  }, 400);
}

// ══════════════════════════════════════════════════════════
// Room — hover proximity detection
// ══════════════════════════════════════════════════════════

const HOVER_PROXIMITY_PX = 60; // generous touch area

function handleRoomMouseMove(event) {
  if (activePanel) return; // don't trigger while a panel is open

  let anyHighlighted = false;

  roomItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    const dist = Math.hypot(event.clientX - cx, event.clientY - cy);
    const inZone = dist < Math.max(rect.width / 2, rect.height / 2) + HOVER_PROXIMITY_PX;

    item.classList.toggle("is-highlighted", inZone);
    if (inZone) anyHighlighted = true;
  });

  roomBlurOverlay?.classList.toggle("is-visible", anyHighlighted);
}

function clearRoomHighlights() {
  roomItems.forEach((item) => item.classList.remove("is-highlighted"));
  roomBlurOverlay?.classList.remove("is-visible");
}

// ══════════════════════════════════════════════════════════
// Panels
// ══════════════════════════════════════════════════════════

const PANEL_BGM_MAP = {
  pensieve: "pensieve",
  clock:    "clock",
  map:      "map",
  rsvp:     "rsvp",
};

function openPanel(panelName) {
  const panel = document.querySelector(`[data-panel="${panelName}"]`);
  if (!panel) return;

  if (activePanel && activePanel !== panel) {
    closePanel(activePanel);
  }

  panel.hidden = false;
  activePanel = panel;
  clearRoomHighlights();

  // Panel-specific setup
  if (panelName === "clock") handleClockPanelOpen();
  if (panelName === "map")   handleMapPanelOpen();
  if (panelName === "rsvp")  handleRsvpPanelOpen();

  // BGM switch
  const bgmKey = PANEL_BGM_MAP[panelName];
  if (bgmKey) playBgm(bgmKey);
}

function closePanel(panel = activePanel) {
  if (!panel) return;
  const panelName = panel.dataset.panel;

  if (panelName === "clock") handleClockPanelClose();
  if (panelName === "map")   handleMapPanelClose();

  panel.hidden = true;
  if (activePanel === panel) activePanel = null;

  // Return to room BGM
  playBgm("room");
}

// ══════════════════════════════════════════════════════════
// Weasley Clock
// ══════════════════════════════════════════════════════════

function getRandomClockDelay() {
  return Math.round(
    CLOCK_CYCLE_INTERVAL_MIN +
    Math.random() * (CLOCK_CYCLE_INTERVAL_MAX - CLOCK_CYCLE_INTERVAL_MIN)
  );
}

function updateClockLabelHighlights(hwSlug, joelSlug) {
  clockLabels.forEach((label) => {
    label.classList.toggle("is-hw-active",   label.dataset.clockPlace === hwSlug);
    label.classList.toggle("is-joel-active", label.dataset.clockPlace === joelSlug);
  });
}

function setClockLocations(hwIdx, joelIdx) {
  if (!specialClock || !hwClockHand || !joelClockHand) return;

  const hw   = HW_CLOCK_ROUTE[hwIdx]   ?? HW_CLOCK_ROUTE[0];
  const joel = JOEL_CLOCK_ROUTE[joelIdx] ?? JOEL_CLOCK_ROUTE[0];
  const hwAngle   = CLOCK_FACE_ANGLES[hw.slug]   ?? 0;
  const joelAngle = CLOCK_FACE_ANGLES[joel.slug] ?? 0;

  activeHwClockIndex   = hwIdx;
  activeJoelClockIndex = joelIdx;
  specialClock.dataset.hwLocation   = hw.slug;
  specialClock.dataset.joelLocation = joel.slug;

  hwClockHand.style.setProperty("--clock-hand-angle",   `${hwAngle}deg`);
  joelClockHand.style.setProperty("--clock-hand-angle", `${joelAngle}deg`);
  updateClockLabelHighlights(hw.slug, joel.slug);

  if (hwClockStatus)  hwClockStatus.textContent  = hw.name;
  if (hwClockNote)    hwClockNote.textContent     = HW_CLOCK_NOTES[hw.slug]   ?? "";
  if (joelClockStatus) joelClockStatus.textContent = joel.name;
  if (joelClockNote)   joelClockNote.textContent   = JOEL_CLOCK_NOTES[joel.slug] ?? "";
}

function scheduleHwClockTick() {
  hwClockTimeoutId = window.setTimeout(() => {
    setClockLocations(
      (activeHwClockIndex + 1) % HW_CLOCK_ROUTE.length,
      activeJoelClockIndex
    );
    scheduleHwClockTick();
  }, getRandomClockDelay());
}

function scheduleJoelClockTick() {
  joelClockTimeoutId = window.setTimeout(() => {
    setClockLocations(
      activeHwClockIndex,
      (activeJoelClockIndex + 1) % JOEL_CLOCK_ROUTE.length
    );
    scheduleJoelClockTick();
  }, getRandomClockDelay());
}

function startClockAnimation() {
  clearClockTimers();
  setClockLocations(0, 0);
  scheduleHwClockTick();
  scheduleJoelClockTick();
}

function stopClockAnimation() {
  clearClockTimers();
  setClockLocations(0, 0);
}

function clearClockTimers() {
  if (hwClockTimeoutId !== null)   { window.clearTimeout(hwClockTimeoutId);   hwClockTimeoutId = null; }
  if (joelClockTimeoutId !== null) { window.clearTimeout(joelClockTimeoutId); joelClockTimeoutId = null; }
}

function handleClockPanelOpen()  { startClockAnimation(); }
function handleClockPanelClose() { stopClockAnimation(); }

// ══════════════════════════════════════════════════════════
// Marauder's Map (mirrors index.js logic exactly)
// ══════════════════════════════════════════════════════════

function getMapIntroDuration() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : MAP_INTRO_DURATION;
}

function setMapSurfaceState(state) {
  if (!mapSurface) return;
  mapSurface.classList.toggle("is-map-intro-active",   state === "intro");
  mapSurface.classList.toggle("is-map-writing-active", state === "writing");
  mapSurface.classList.toggle("is-map-blank-active",   state === "blank");
}

function setMapLineStrokeProgress(lineText, progress) {
  const p = Math.min(Math.max(progress, 0), 1);
  lineText.style.strokeDasharray  = `${MAP_STROKE_DASH}`;
  lineText.style.strokeDashoffset = `${MAP_STROKE_DASH * (1 - p)}`;
  lineText.style.setProperty("--map-fill-opacity", `${p * 0.18}`);
}

function getMapLineMetrics() {
  if (!mapLineTexts.length) return [];
  if (mapLineMetrics.length === mapLineTexts.length) return mapLineMetrics;

  const totalChars = mapLineTexts.reduce((n, el) => n + Math.max(el.textContent?.length ?? 0, 1), 0);
  let running = 0;

  mapLineMetrics = mapLineTexts.map((el) => {
    const value = el.textContent ?? "";
    const count = Math.max(value.length, 1);
    const start = running / totalChars;
    running += count;
    return { lineText: el, value, characterCount: count, startProgress: start, endProgress: running / totalChars };
  });

  return mapLineMetrics;
}

function getCharacterAnchor(lineText, idx, anchor) {
  try {
    return anchor === "start"
      ? { x: lineText.getStartPositionOfChar(idx).x, y: lineText.getStartPositionOfChar(idx).y }
      : { x: lineText.getEndPositionOfChar(idx).x,   y: lineText.getEndPositionOfChar(idx).y };
  } catch {
    try {
      const e = lineText.getExtentOfChar(idx);
      return { x: anchor === "start" ? e.x : e.x + e.width, y: e.y + e.height * 0.72 };
    } catch { return null; }
  }
}

function interpolatePoint(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function findNearestCharacterAnchor(lineText, value, startIndex, step, anchor) {
  for (let i = startIndex; i >= 0 && i < value.length; i += step) {
    if (value[i]?.trim()) return getCharacterAnchor(lineText, i, anchor);
  }
  return null;
}

function getCharacterPoint(metric, charIdx, progressWithin) {
  const { lineText, value, characterCount } = metric;
  const si = Math.min(Math.max(charIdx, 0), characterCount - 1);
  const sp = Math.min(Math.max(progressWithin, 0), 1);
  const ch = value[si] ?? "";

  if (!ch.trim()) {
    const prev = findNearestCharacterAnchor(lineText, value, si - 1, -1, "end");
    const next = findNearestCharacterAnchor(lineText, value, si + 1,  1, "start");
    if (prev && next) return interpolatePoint(prev, next, sp);
    return prev ?? next ?? { x: 0, y: 0 };
  }

  const start = getCharacterAnchor(lineText, si, "start");
  const end   = getCharacterAnchor(lineText, si, "end");
  if (start && end) return interpolatePoint(start, end, sp);
  return start ?? end ?? { x: 0, y: 0 };
}

function setMapQuillPosition(point, angle) {
  if (!mapQuill || !mapSpellSvg) return;
  const vb = mapSpellSvg.viewBox.baseVal;
  const sb = mapSpellSvg.getBoundingClientRect();
  if (!sb.width || !sb.height || !vb.width || !vb.height) return;

  const x = ((point.x - vb.x) / vb.width)  * sb.width;
  const y = ((point.y - vb.y) / vb.height) * sb.height;
  mapQuill.style.transform = `translate(${x - MAP_QUILL_OFFSET_X}px, ${y - MAP_QUILL_OFFSET_Y}px) rotate(${angle}deg)`;
}

function positionMapQuill(progress) {
  const metrics = getMapLineMetrics();
  if (!metrics.length || !mapQuill) return;

  const p = Math.min(Math.max(progress, 0), 1);
  const activeLine = metrics.find((m) => p <= m.endProgress) ?? metrics[metrics.length - 1];
  const span = Math.max(activeLine.endProgress - activeLine.startProgress, Number.EPSILON);
  const lp = Math.min(Math.max((p - activeLine.startProgress) / span, 0), 1);
  const scaledProgress = lp * activeLine.characterCount;
  const charIdx = Math.min(Math.floor(scaledProgress), activeLine.characterCount - 1);
  const progressWithin = scaledProgress - charIdx;

  const current = getCharacterPoint(activeLine, charIdx, progressWithin);
  const next    = getCharacterPoint(activeLine, charIdx, Math.min(progressWithin + 0.15, 1));
  const angle   = Math.atan2(next.y - current.y, next.x - current.x) * (180 / Math.PI);

  setMapQuillPosition(current, angle);
}

function updateMapRevealProgress(progress) {
  const metrics = getMapLineMetrics();
  if (!metrics.length) return;

  metrics.forEach((m) => {
    const span = Math.max(m.endProgress - m.startProgress, Number.EPSILON);
    setMapLineStrokeProgress(m.lineText, (progress - m.startProgress) / span);
  });

  positionMapQuill(progress);
}

function clearMapTimers() {
  if (mapAnimationFrameId !== null) { window.cancelAnimationFrame(mapAnimationFrameId); mapAnimationFrameId = null; }
  if (mapBlankTimeoutId   !== null) { window.clearTimeout(mapBlankTimeoutId);           mapBlankTimeoutId   = null; }
  if (mapIntroTimeoutId   !== null) { window.clearTimeout(mapIntroTimeoutId);           mapIntroTimeoutId   = null; }
}

function showBlankMapStage() {
  clearMapTimers();
  mapRevealStartedAt = 0;
  setMapSurfaceState("blank");
  if (mapIntroStage)   { mapIntroStage.hidden   = true; mapIntroStage.setAttribute("aria-hidden", "true"); }
  if (mapWritingStage) { mapWritingStage.hidden  = true; mapWritingStage.setAttribute("aria-hidden", "true"); }
  if (mapBlankStage)   { mapBlankStage.hidden    = false; mapBlankStage.setAttribute("aria-hidden", "false"); }
}

function completeMapReveal() {
  clearMapTimers();
  updateMapRevealProgress(1);
  markMapPlayed();
  mapBlankTimeoutId = window.setTimeout(showBlankMapStage, MAP_BLANK_DELAY);
}

function animateMapReveal(timestamp) {
  if (!mapSpellSvg || !mapLineTexts.length || !mapQuill) { showBlankMapStage(); return; }

  if (!mapRevealStartedAt) mapRevealStartedAt = timestamp;
  const progress = Math.min((timestamp - mapRevealStartedAt) / MAP_REVEAL_DURATION, 1);
  updateMapRevealProgress(progress);

  if (progress >= 1) { completeMapReveal(); return; }
  mapAnimationFrameId = window.requestAnimationFrame(animateMapReveal);
}

function resetMapRevealState() {
  clearMapTimers();
  mapRevealStartedAt = 0;
  setMapSurfaceState("intro");
  if (mapIntroStage)   { mapIntroStage.hidden   = false; mapIntroStage.setAttribute("aria-hidden", "false"); }
  if (mapWritingStage) { mapWritingStage.hidden  = true;  mapWritingStage.setAttribute("aria-hidden", "true"); }
  if (mapBlankStage)   { mapBlankStage.hidden    = true;  mapBlankStage.setAttribute("aria-hidden", "true"); }
  mapLineTexts.forEach((l) => setMapLineStrokeProgress(l, 0));
  positionMapQuill(0);
}

function setMapIntroMotionOrigin() {
  if (!mapSurface) return;
  const sb = mapSurface.getBoundingClientRect();
  if (!sb.width || !sb.height) return;
  mapSurface.style.setProperty("--map-intro-origin-x", "0px");
  mapSurface.style.setProperty("--map-intro-origin-y", "18vh");
  mapSurface.style.setProperty("--map-intro-origin-scale", "0.28");
}

function startMapWritingSequence() {
  setMapSurfaceState("writing");
  if (mapIntroStage)   { mapIntroStage.hidden   = true;  mapIntroStage.setAttribute("aria-hidden", "true"); }
  if (mapWritingStage) { mapWritingStage.hidden  = false; mapWritingStage.setAttribute("aria-hidden", "false"); }
  clearMapTimers();
  mapRevealStartedAt = 0;
  mapAnimationFrameId = window.requestAnimationFrame(animateMapReveal);
}

function startMapReveal() {
  const introDuration = getMapIntroDuration();
  resetMapRevealState();
  setMapIntroMotionOrigin();

  if (!introDuration) { startMapWritingSequence(); return; }
  mapIntroTimeoutId = window.setTimeout(() => { mapIntroTimeoutId = null; startMapWritingSequence(); }, introDuration);
}

function handleMapPanelOpen() {
  if (hasMapPlayed()) { showBlankMapStage(); return; }
  startMapReveal();
}

function handleMapPanelClose() {
  clearMapTimers();
  if (hasMapPlayed()) { showBlankMapStage(); return; }
  resetMapRevealState();
}

// ══════════════════════════════════════════════════════════
// RSVP panel
// ══════════════════════════════════════════════════════════

function handleRsvpPanelOpen() {
  loadTallyEmbeds();

  // Fly owl in
  if (owlRsvpAnim) {
    owlRsvpAnim.classList.remove("is-flying-out");
    owlRsvpAnim.classList.add("is-flying-in");
    owlRsvpAnim.addEventListener("animationend", () => {
      owlRsvpAnim.classList.remove("is-flying-in");
    }, { once: true });
  }

  // Open envelope flap after a short delay
  setTimeout(() => {
    const flap = rsvpPanel?.querySelector("[data-envelope-flap]");
    if (flap) flap.classList.add("is-open");
  }, 600);
}

function triggerRsvpSubmitAnimation() {
  // Close flap, owl grabs and flies out
  const flap = rsvpPanel?.querySelector("[data-envelope-flap]");
  if (flap) flap.classList.remove("is-open");

  setTimeout(() => {
    if (owlRsvpAnim) {
      owlRsvpAnim.classList.remove("is-flying-in");
      owlRsvpAnim.classList.add("is-flying-out");
    }
  }, 500);
}

// ══════════════════════════════════════════════════════════
// Tally embed loader (mirrors index.js)
// ══════════════════════════════════════════════════════════

function loadTallyEmbeds() {
  if (typeof window.Tally !== "undefined") {
    window.Tally.loadEmbeds();
    return Promise.resolve();
  }

  if (tallyEmbedLoadPromise) return tallyEmbedLoadPromise;

  tallyEmbedLoadPromise = new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${TALLY_EMBED_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load",  () => { window.Tally?.loadEmbeds(); resolve(); }, { once: true });
      existing.addEventListener("error", () => { loadTallyFallback(); resolve(); }, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src     = TALLY_EMBED_SCRIPT;
    script.onload  = () => { window.Tally?.loadEmbeds(); resolve(); };
    script.onerror = () => { loadTallyFallback(); resolve(); };
    document.body.appendChild(script);
  });

  return tallyEmbedLoadPromise;
}

function loadTallyFallback() {
  document.querySelectorAll("iframe[data-tally-src]:not([src])").forEach((iframe) => {
    iframe.src = iframe.dataset.tallySrc;
  });
}

// Listen for Tally submission event to trigger owl animation
window.addEventListener("message", (event) => {
  // Tally posts a message on submission with type "tally-form-submitted"
  if (event.origin === "https://tally.so" && event.data?.type === "tally-form-submitted") {
    if (activePanel?.dataset?.panel === "rsvp") {
      triggerRsvpSubmitAnimation();
    }
  }
});

// ══════════════════════════════════════════════════════════
// Music
// ══════════════════════════════════════════════════════════

function initMusicState() {
  isMusicMuted = lsGet(HP_MUSIC_MUTED_KEY) !== "false";
  musicToggle?.toggleAttribute("data-muted", isMusicMuted);
}

function playBgm(key) {
  if (key === currentBgmKey) return;

  // Fade out current
  const prev = bgmTracks[currentBgmKey];
  if (prev) {
    prev.pause();
    prev.currentTime = 0;
  }

  currentBgmKey = key;
  const track = bgmTracks[key];
  if (!track || isMusicMuted) return;

  track.play().catch(() => { /* autoplay blocked; user can enable via the music toggle */ });
}

function toggleMusic() {
  isMusicMuted = !isMusicMuted;
  lsSet(HP_MUSIC_MUTED_KEY, String(isMusicMuted));
  musicToggle?.toggleAttribute("data-muted", isMusicMuted);

  if (isMusicMuted) {
    const track = bgmTracks[currentBgmKey];
    if (track) { track.pause(); track.currentTime = 0; }
  } else {
    playBgm(currentBgmKey ?? "room");
  }
}

// ══════════════════════════════════════════════════════════
// Wand cursor + sparkle particles
// ══════════════════════════════════════════════════════════

function resizeWandCanvas() {
  if (!wandCanvas) return;
  wandCanvas.width  = window.innerWidth;
  wandCanvas.height = window.innerHeight;
}

const WAND_CURSOR_SIZE = 24;
// Wand drawn as a simple angled line ending in a tip
function drawWand(x, y) {
  if (!ctx) return;
  ctx.save();
  ctx.translate(x, y);
  // Draw wand body
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(WAND_CURSOR_SIZE * 0.6, WAND_CURSOR_SIZE * 0.6);
  ctx.strokeStyle = "#e8d090";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.stroke();

  // Wand tip glow
  ctx.beginPath();
  ctx.arc(0, 0, isLumos ? 10 : 3, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, isLumos ? 10 : 3);
  grad.addColorStop(0, isLumos ? "rgba(255,240,140,0.95)" : "rgba(255,220,80,0.85)");
  grad.addColorStop(1, "rgba(255,180,40,0)");
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.restore();
}

function spawnParticle(x, y) {
  const angle  = Math.random() * Math.PI * 2;
  const speed  = 0.5 + Math.random() * 1.5;
  const life   = 0.6 + Math.random() * 0.6; // seconds
  particles.push({
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 0.6, // slight upward drift
    life,
    maxLife: life,
    size: 1.5 + Math.random() * 2.5,
    hue: isLumos ? (48 + Math.random() * 20) : (40 + Math.random() * 30),
  });
}

let lastParticleTime = 0;
function updateAndDrawParticles(now) {
  if (!ctx) return;

  // Spawn particles
  if (now - lastParticleTime > 16) {
    spawnParticle(mouseX, mouseY);
    if (isLumos) {
      spawnParticle(mouseX + (Math.random() - 0.5) * 8, mouseY + (Math.random() - 0.5) * 8);
    }
    lastParticleTime = now;
  }

  particles.forEach((p) => {
    p.x   += p.vx;
    p.y   += p.vy;
    p.vy  += 0.04; // gravity
    p.life -= 0.016;

    const alpha = Math.max(p.life / p.maxLife, 0);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${alpha * 0.9})`;
    ctx.fill();
  });

  particles = particles.filter((p) => p.life > 0);
}

function renderWandFrame(now) {
  if (!ctx || !wandCanvas) return;
  ctx.clearRect(0, 0, wandCanvas.width, wandCanvas.height);
  updateAndDrawParticles(now);
  drawWand(mouseX, mouseY);
  window.requestAnimationFrame(renderWandFrame);
}

// ══════════════════════════════════════════════════════════
// Spell system
// ══════════════════════════════════════════════════════════

function handleSpell(spell) {
  if (spell === SPELLS.lumos) {
    isLumos = true;
    candles.forEach((c) => c.classList.add("is-lit"));
  } else if (spell === SPELLS.nox) {
    isLumos = false;
    candles.forEach((c) => c.classList.remove("is-lit"));
  }
}

function handleRoomKeypress(event) {
  // Only monitor when no panel is open and room is visible
  if (activePanel) return;
  if (roomScreen?.hidden) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  const char = event.key.length === 1 ? event.key.toLowerCase() : "";
  if (!char) return;

  spellBuffer = (spellBuffer + char).slice(-SPELL_BUFFER_SIZE);

  for (const spell of Object.values(SPELLS)) {
    if (spellBuffer.endsWith(spell)) {
      handleSpell(spell);
      spellBuffer = "";
      break;
    }
  }
}

// ══════════════════════════════════════════════════════════
// Global keyboard handler (Escape closes panels)
// ══════════════════════════════════════════════════════════

function handleGlobalKeydown(event) {
  if (event.key === "Escape") {
    if (owlIntro && !owlIntro.hidden) {
      closeOwlIntro();
      return;
    }
    if (activePanel) {
      closePanel(activePanel);
      return;
    }
  }

  // Route keypresses to spell system
  handleRoomKeypress(event);
}

// ══════════════════════════════════════════════════════════
// Event listeners
// ══════════════════════════════════════════════════════════

// Password form
passwordForm?.addEventListener("submit", handlePasswordSubmit);

// Room item clicks
roomItems.forEach((item) => {
  item.addEventListener("click", () => {
    openPanel(item.dataset.roomItem);
  });
});

// Room mousemove for proximity highlight
document.addEventListener("mousemove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
  if (roomScreen && !roomScreen.hidden) {
    handleRoomMouseMove(event);
  }
});

// Panel close buttons
panelCloseButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    closePanel(btn.closest("[data-panel]"));
  });
});

// Click outside panel to close
panels.forEach((panel) => {
  panel.addEventListener("click", (event) => {
    if (event.target === panel) closePanel(panel);
  });
});

// Map replay
replayMapBtn?.addEventListener("click", () => {
  clearMapPlayed();
  startMapReveal();
});

// Music toggle
musicToggle?.addEventListener("click", toggleMusic);

// Global keyboard
window.addEventListener("keydown", handleGlobalKeydown);

// Resize
window.addEventListener("resize", resizeWandCanvas);

// ══════════════════════════════════════════════════════════
// Init
// ══════════════════════════════════════════════════════════

function init() {
  resizeWandCanvas();
  initMusicState();

  // Start wand render loop
  window.requestAnimationFrame(renderWandFrame);

  if (hasVisited()) {
    // Returning visitor — skip gate, go straight to room
    if (gateScreen) gateScreen.hidden = true;
    showRoom();
  } else {
    showGateScreen();
  }
}

init();
