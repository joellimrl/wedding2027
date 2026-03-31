// feat/rsvp/rsvp.js — First-time owl intro + RSVP panel: owl animations + Tally embed

import { hasSeenFirstRsvp, markFirstRsvp } from "../shared/storage.js";

const TALLY_EMBED_SCRIPT = "https://tally.so/widgets/embed.js";

// DOM refs — populated by initRsvp() after fragments are injected
let rsvpPanel        = null;
let owlRsvpAnim      = null;
let owlIntro         = null;
let owlIntroEnvelope = null;

// State
let tallyEmbedLoadPromise = null;
let _getActivePanel = () => null;

// ── Tally embed ───────────────────────────────────────────

function loadTallyFallback() {
  document.querySelectorAll("iframe[data-tally-src]:not([src])").forEach((iframe) => {
    iframe.src = iframe.dataset.tallySrc;
  });
}

export function loadTallyEmbeds() {
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

// ── First-time owl intro ──────────────────────────────────

export function startOwlIntro() {
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

    loadTallyEmbeds();
    markFirstRsvp();
  }, 1900);
}

export function closeOwlIntro() {
  if (!owlIntro) return;
  const flap = owlIntroEnvelope?.querySelector("[data-envelope-flap]");
  if (flap) flap.classList.remove("is-open");

  setTimeout(() => {
    if (owlIntroEnvelope) owlIntroEnvelope.hidden = true;
    owlIntro.classList.add("is-flying-out");

    setTimeout(() => {
      owlIntro.hidden = true;
      owlIntro.classList.remove("is-flying-out");
    }, 1100);
  }, 400);
}

// ── RSVP panel ────────────────────────────────────────────

export function handleRsvpPanelOpen() {
  loadTallyEmbeds();

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
  const flap = rsvpPanel?.querySelector("[data-envelope-flap]");
  if (flap) flap.classList.remove("is-open");

  setTimeout(() => {
    if (owlRsvpAnim) {
      owlRsvpAnim.classList.remove("is-flying-in");
      owlRsvpAnim.classList.add("is-flying-out");
    }
  }, 500);
}

// ── Init ──────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {function} opts.getActivePanel - returns current open panel element or null
 */
export function initRsvp({ getActivePanel }) {
  _getActivePanel = getActivePanel;

  // Query DOM now that the fragment has been injected
  rsvpPanel        = document.querySelector('[data-panel="rsvp"]');
  owlRsvpAnim      = document.querySelector("[data-owl-rsvp-anim]");
  owlIntro         = document.querySelector("[data-owl-intro]");
  owlIntroEnvelope = document.querySelector("[data-owl-intro-envelope]");

  // Listen for Tally RSVP submission
  window.addEventListener("message", (event) => {
    if (event.origin === "https://tally.so" && event.data?.type === "tally-form-submitted") {
      if (_getActivePanel()?.dataset?.panel === "rsvp") {
        triggerRsvpSubmitAnimation();
      }
    }
  });

  // Close button on owl intro overlay
  document.querySelector("[data-owl-intro-close]")?.addEventListener("click", closeOwlIntro);
}
