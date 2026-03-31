// feat/room/room.js — Common room scene: hover detection, sprite cursor-follower

const HOVER_PROXIMITY_PX = 60; // generous touch area

const SPRITE_SPEED_PX_S = 150; // walking speed in px/s
const SPRITE_ARRIVE_PX  = 10;  // stop-walking threshold
const SPRITE_FRAME_W    = 128; // sprite frame width in px

// DOM refs — populated by initRoom() after fragments are injected
let roomScreen      = null;
let roomBlurOverlay = null;
let roomItems       = [];
let roomSprite      = null;

// Callbacks
let _getActivePanel = () => null;

// Sprite state
let spriteX           = -1; // -1 = not yet initialised
let spriteY           = -1;
let spriteTargetX     = 0;
let spriteTargetY     = 0;
let spriteWalking     = false;
let spriteFacingRight = true;
let spritePrevTime    = 0;

// ── Room reveal ───────────────────────────────────────────

/**
 * @param {object} opts
 * @param {function} opts.hasSeenFirstRsvp
 * @param {function} opts.onFirstVisit - called ~900ms after room appears (first-time only)
 * @param {function} opts.playBgm
 */
export function showRoom({ hasSeenFirstRsvp, onFirstVisit, playBgm, instant = false }) {
  if (!roomScreen) return;
  roomScreen.hidden = false;
  if (!instant) {
    roomScreen.classList.add("is-entering");
    roomScreen.addEventListener(
      "animationend",
      () => roomScreen.classList.remove("is-entering"),
      { once: true }
    );
  }

  playBgm("room");

  if (!hasSeenFirstRsvp()) {
    setTimeout(() => onFirstVisit?.(), 900);
  }
}

export function isRoomVisible() {
  return roomScreen != null && !roomScreen.hidden;
}

// ── Hover proximity detection ─────────────────────────────

export function handleRoomMouseMove(event) {
  if (_getActivePanel()) return; // don't trigger while a panel is open

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

export function clearRoomHighlights() {
  roomItems.forEach((item) => item.classList.remove("is-highlighted"));
  roomBlurOverlay?.classList.remove("is-visible");
}

// ── Sprite cursor-follower ────────────────────────────────

export function updateSpriteTarget(clientX, clientY) {
  if (!roomScreen) return;
  const rect = roomScreen.getBoundingClientRect();
  const pad  = SPRITE_FRAME_W / 2;
  spriteTargetX = Math.max(pad, Math.min(rect.width  - pad, clientX - rect.left));
  spriteTargetY = Math.max(pad, Math.min(rect.height - pad, clientY - rect.top));
}

function initSprite() {
  if (!roomScreen || !roomSprite) return;
  const rect = roomScreen.getBoundingClientRect();
  if (!rect.width) return;
  spriteX       = rect.width  * 0.5;
  spriteY       = rect.height * 0.68;
  spriteTargetX = spriteX;
  spriteTargetY = spriteY;
  applySpriteCss();
}

function applySpriteCss() {
  if (!roomSprite) return;
  roomSprite.style.left = `${spriteX - SPRITE_FRAME_W / 2}px`;
  roomSprite.style.top  = `${spriteY - SPRITE_FRAME_W}px`;
  roomSprite.classList.toggle("is-walking", spriteWalking);
  roomSprite.classList.toggle("is-flipped", !spriteFacingRight);
}

export function tickSprite(now) {
  if (!roomSprite) return;

  // Pause when room hidden or a panel is open
  if (!roomScreen || roomScreen.hidden || _getActivePanel()) {
    if (spriteWalking) { spriteWalking = false; applySpriteCss(); }
    spritePrevTime = 0;
    return;
  }

  // Lazy-initialise position on first tick after room appears
  if (spriteX < 0) { initSprite(); return; }

  const dt = spritePrevTime > 0 ? Math.min((now - spritePrevTime) / 1000, 0.1) : 0;
  spritePrevTime = now;

  const dx   = spriteTargetX - spriteX;
  const dy   = spriteTargetY - spriteY;
  const dist = Math.hypot(dx, dy);

  if (dist < SPRITE_ARRIVE_PX) {
    if (spriteWalking) { spriteWalking = false; applySpriteCss(); }
    return;
  }

  const step = Math.min(SPRITE_SPEED_PX_S * dt, dist);
  spriteX += (dx / dist) * step;
  spriteY += (dy / dist) * step;
  if (Math.abs(dx) > 1) spriteFacingRight = dx > 0;
  if (!spriteWalking) spriteWalking = true;
  applySpriteCss();
}

// ── Init ──────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {function} opts.getActivePanel - returns current open panel element or null
 * @param {function} opts.onItemClick    - called with panel name string when an item is clicked
 */
export function initRoom({ getActivePanel, onItemClick }) {
  _getActivePanel = getActivePanel;

  // Query DOM now that the fragment has been injected
  roomScreen      = document.querySelector("[data-room-screen]");
  roomBlurOverlay = document.querySelector("[data-room-blur-overlay]");
  roomItems       = Array.from(document.querySelectorAll("[data-room-item]"));
  roomSprite      = document.querySelector("[data-room-sprite]");

  roomItems.forEach((item) => {
    item.addEventListener("click", () => onItemClick(item.dataset.roomItem));
  });
}
