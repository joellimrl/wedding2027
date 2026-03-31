// feat/clock/clock.js — Weasley clock panel: hand animation + status readout

const CLOCK_FACE_ANGLES = { work: 0, gym: 60, yoga: 120, toilet: 180, bed: 240, desk: 300 };

const HW_CLOCK_ROUTE = [
  { name: "Work", slug: "work" },
  { name: "Gym",  slug: "gym"  },
  { name: "Yoga", slug: "yoga" },
  { name: "Bed",  slug: "bed"  },
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

// DOM refs — populated by handleClockPanelOpen() after fragments are injected
let specialClock    = null;
let clockLabels     = [];
let hwClockHand     = null;
let joelClockHand   = null;
let hwClockStatus   = null;
let joelClockStatus = null;
let hwClockNote     = null;
let joelClockNote   = null;

function resolveClockDomRefs() {
  if (specialClock) return; // already resolved
  specialClock    = document.querySelector("[data-special-clock]");
  clockLabels     = Array.from(document.querySelectorAll("[data-clock-place]"));
  hwClockHand     = document.querySelector('[data-clock-hand="hw"]');
  joelClockHand   = document.querySelector('[data-clock-hand="joel"]');
  hwClockStatus   = document.querySelector('[data-clock-status="hw"]');
  joelClockStatus = document.querySelector('[data-clock-status="joel"]');
  hwClockNote     = document.querySelector('[data-clock-note="hw"]');
  joelClockNote   = document.querySelector('[data-clock-note="joel"]');
}

// State
let activeHwClockIndex   = 0;
let activeJoelClockIndex = 0;
let hwClockTimeoutId     = null;
let joelClockTimeoutId   = null;

// ── Helpers ───────────────────────────────────────────────

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

  const hw   = HW_CLOCK_ROUTE[hwIdx]     ?? HW_CLOCK_ROUTE[0];
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

  if (hwClockStatus)   hwClockStatus.textContent   = hw.name;
  if (hwClockNote)     hwClockNote.textContent      = HW_CLOCK_NOTES[hw.slug]     ?? "";
  if (joelClockStatus) joelClockStatus.textContent  = joel.name;
  if (joelClockNote)   joelClockNote.textContent    = JOEL_CLOCK_NOTES[joel.slug] ?? "";
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

function clearClockTimers() {
  if (hwClockTimeoutId !== null)   { window.clearTimeout(hwClockTimeoutId);   hwClockTimeoutId   = null; }
  if (joelClockTimeoutId !== null) { window.clearTimeout(joelClockTimeoutId); joelClockTimeoutId = null; }
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

// ── Panel lifecycle ───────────────────────────────────────

export function handleClockPanelOpen()  { resolveClockDomRefs(); startClockAnimation(); }
export function handleClockPanelClose() { stopClockAnimation();  }
