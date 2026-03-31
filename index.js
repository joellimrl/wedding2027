// index.js — Harry Potter Wedding Site — orchestrator
// Imports from feat/* modules and wires everything together.
// Vanilla ES module. No dependencies.
//
// Feature modules:
//   feat/shared/storage.js  — localStorage helpers & state flags
//   feat/password/password.js — gate screen, Fat Lady, door swing
//   feat/room/room.js         — common room, items, sprite
//   feat/clock/clock.js       — Weasley clock panel
//   feat/map/map.js           — Marauder's Map panel
//   feat/rsvp/rsvp.js         — owl intro + RSVP panel
//   feat/pensieve/pensieve.js — pensieve panel (CSS-only, stub exported)

import { hasVisited, lsGet, lsSet } from "./feat/shared/storage.js";
import { initPassword, showGateScreen }           from "./feat/password/password.js";
import { initRoom, showRoom, handleRoomMouseMove, updateSpriteTarget, tickSprite, isRoomVisible } from "./feat/room/room.js";
import { handleClockPanelOpen, handleClockPanelClose } from "./feat/clock/clock.js";
import { initMap, handleMapPanelOpen, handleMapPanelClose } from "./feat/map/map.js";
import { initRsvp, startOwlIntro, closeOwlIntro, handleRsvpPanelOpen } from "./feat/rsvp/rsvp.js";
import { clearMapPlayed } from "./feat/shared/storage.js";

// ══════════════════════════════════════════════════════════
// Orchestrator-level constants (not owned by any one feature)
// ══════════════════════════════════════════════════════════

const HP_MUSIC_MUTED_KEY    = "HP_MUSIC_MUTED";

// Spell easter eggs
const SPELL_BUFFER_SIZE = 12;
const SPELLS = {
  lumos: "lumos",
  nox:   "nox",
};

// ══════════════════════════════════════════════════════════
// DOM refs (orchestrator-level only)
// ══════════════════════════════════════════════════════════

// Panels — populated after HTML fragments are injected
let panels           = [];
let panelCloseButtons = [];

// Music
const musicToggle      = document.querySelector("[data-music-toggle]");
const bgmTracks = {
  room:     document.getElementById("bgm-room"),
  pensieve: document.getElementById("bgm-pensieve"),
  clock:    document.getElementById("bgm-clock"),
  map:      document.getElementById("bgm-map"),
  rsvp:     document.getElementById("bgm-rsvp"),
};

// Candles — populated after HTML fragments are injected
let candles          = [];

// Wand canvas
const wandCanvas       = document.querySelector("[data-wand-canvas]");
const ctx              = wandCanvas ? wandCanvas.getContext("2d") : null;

// ══════════════════════════════════════════════════════════
// State
// ══════════════════════════════════════════════════════════

let activePanel       = null;
let isMusicMuted      = true;
let currentBgmKey     = null;
let isLumos           = false;
let spellBuffer       = "";

// Wand particles
let particles = [];
let mouseX = 0;
let mouseY = 0;

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

  playBgm("room");
}

// ══════════════════════════════════════════════════════════
// Music
// ══════════════════════════════════════════════════════════

function initMusicState() {
  isMusicMuted = lsGet(HP_MUSIC_MUTED_KEY) !== "false";
  musicToggle?.toggleAttribute("data-muted", isMusicMuted);
}

function playBgm(key) {
  if (key === currentBgmKey) return;

  const prev = bgmTracks[currentBgmKey];
  if (prev) {
    prev.pause();
    prev.currentTime = 0;
  }

  currentBgmKey = key;
  const track = bgmTracks[key];
  if (!track || isMusicMuted) return;

  track.play().catch(() => { /* autoplay blocked */ });
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

function drawWand(x, y) {
  if (!ctx) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(WAND_CURSOR_SIZE * 0.6, WAND_CURSOR_SIZE * 0.6);
  ctx.strokeStyle = "#e8d090";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.stroke();

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
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.5 + Math.random() * 1.5;
  const life  = 0.6 + Math.random() * 0.6;
  particles.push({
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 0.6,
    life,
    maxLife: life,
    size: 1.5 + Math.random() * 2.5,
    hue: isLumos ? (48 + Math.random() * 20) : (40 + Math.random() * 30),
  });
}

let lastParticleTime = 0;
function updateAndDrawParticles(now) {
  if (!ctx) return;

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
    p.vy  += 0.04;
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
  tickSprite(now);
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
  if (activePanel) return;
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
// Global keyboard handler
// ══════════════════════════════════════════════════════════

function handleGlobalKeydown(event) {
  if (event.key === "Escape") {
    if (activePanel) {
      closePanel(activePanel);
      return;
    }
    // Delegate owl intro close to the rsvp module's close handler
    closeOwlIntro();
    return;
  }

  handleRoomKeypress(event);
}

// ══════════════════════════════════════════════════════════
// Event listeners
// ══════════════════════════════════════════════════════════

// These listeners don't depend on fragments — wire immediately
document.addEventListener("mousemove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
  handleRoomMouseMove(event);
  updateSpriteTarget(event.clientX, event.clientY);
});
musicToggle?.addEventListener("click", toggleMusic);
window.addEventListener("keydown", handleGlobalKeydown);
window.addEventListener("resize", resizeWandCanvas);

// ══════════════════════════════════════════════════════════
// Init
// ══════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════
// Fragment loader — injects feat HTML files into slot elements
// ══════════════════════════════════════════════════════════

async function loadFragments() {
  const slots = [
    { attr: "password", url: "./feat/password/password.html" },
    { attr: "room",     url: "./feat/room/room.html" },
    { attr: "rsvp",     url: "./feat/rsvp/rsvp.html" },
    { attr: "pensieve", url: "./feat/pensieve/pensieve.html" },
    { attr: "clock",    url: "./feat/clock/clock.html" },
    { attr: "map",      url: "./feat/map/map.html" },
  ];

  await Promise.all(slots.map(async ({ attr, url }) => {
    const slot = document.querySelector(`[data-slot="${attr}"]`);
    if (!slot) return;
    try {
      const html = await fetch(url).then((r) => r.text());
      slot.insertAdjacentHTML("beforebegin", html);
      slot.remove();
    } catch (e) {
      console.warn(`[fragments] failed to load ${url}`, e);
    }
  }));
}

// ══════════════════════════════════════════════════════════
// Init
// ══════════════════════════════════════════════════════════

async function init() {
  // 1. Inject HTML fragments into slot elements
  await loadFragments();

  // 2. Query fragment-sourced DOM refs now that they exist
  panels           = Array.from(document.querySelectorAll("[data-panel]"));
  panelCloseButtons = Array.from(document.querySelectorAll("[data-panel-close]"));
  candles          = Array.from(document.querySelectorAll("[data-candle]"));

  // 3. Wire listeners that depend on fragment DOM
  panelCloseButtons.forEach((btn) => {
    btn.addEventListener("click", () => closePanel(btn.closest("[data-panel]")));
  });
  panels.forEach((panel) => {
    panel.addEventListener("click", (event) => {
      if (event.target === panel) closePanel(panel);
    });
  });

  // 4. Boot
  resizeWandCanvas();
  initMusicState();

  initPassword({
    onAuthenticated: () => showRoom({ playBgm }),
  });

  initRoom({
    getActivePanel: () => activePanel,
    onItemClick: (panelName) => openPanel(panelName),
  });

  initMap();

  initRsvp({
    getActivePanel: () => activePanel,
  });

  window.requestAnimationFrame(renderWandFrame);

  if (hasVisited()) {
    showRoom({ playBgm });
  } else {
    showGateScreen();
  }
}

init();
