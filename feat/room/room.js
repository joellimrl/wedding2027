// feat/room/room.js — Common room scene: hover detection, sprite cursor-follower
// All coordinates are relative to the fixed-aspect-ratio *stage* element,
// which is contain-fit inside the full-screen roomScreen.

const HOVER_PROXIMITY_PX = 60; // generous touch area

const SPRITE_SPEED_PX_S = 150; // walking speed in px/s
const SPRITE_ARRIVE_PX  = 10;  // stop-walking threshold
const SPRITE_FRAME_W    = 128; // sprite frame width in px

// Background image source (relative to document root)
const BG_IMAGE_SRC = "./assets/noob_background.png";

// Walkable polygon — normalised 0-1 coords relative to the background image.
// Placeholder — refine with room-grid-test.html then paste here.
// const WALKABLE_POLYGON = [
//   [0.05, 0.50], [0.35, 0.38], [0.65, 0.38],
//   [0.95, 0.50], [0.95, 0.98], [0.05, 0.98],
// ];

// Walkable polygon — paste into WALKABLE_POLYGON in room.js
const WALKABLE_POLYGON = [
  [0.0003, 0.8112],
  [0.4509, 0.3763],
  [0.5187, 0.4375],
  [0.5696, 0.3949],
  [0.9988, 0.8457],
  [0.9997, 0.8777],
  [0.8801, 0.9987],
  [0.1190, 0.9973],
  [0.0003, 0.8471]
];


// DOM refs — populated by initRoom() after fragments are injected
let roomScreen      = null;
let roomStage       = null;
let roomBlurOverlay = null;
let roomItems       = [];
let roomSprite      = null;

// Stage geometry (px) — updated by resizeStage()
let stageW      = 0;
let stageH      = 0;
let bgNaturalW  = 0;
let bgNaturalH  = 0;

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

// ── Stage sizing (contain-fit) ────────────────────────────

function resizeStage() {
  if (!roomScreen || !roomStage || !bgNaturalW) return;

  const screenRect = roomScreen.getBoundingClientRect();
  const sw = screenRect.width;
  const sh = screenRect.height;
  if (!sw || !sh) return;

  const imgAspect    = bgNaturalW / bgNaturalH;
  const screenAspect = sw / sh;

  let newW, newH;
  if (screenAspect > imgAspect) {
    // Letterbox left/right — height fills
    newH = sh;
    newW = sh * imgAspect;
  } else {
    // Letterbox top/bottom — width fills
    newW = sw;
    newH = sw / imgAspect;
  }

  // Rescale sprite position proportionally if stage was already sized
  const prevW = stageW;
  const prevH = stageH;

  stageW = newW;
  stageH = newH;

  roomStage.style.width  = `${newW}px`;
  roomStage.style.height = `${newH}px`;
  roomStage.style.left   = `${(sw - newW) / 2}px`;
  roomStage.style.top    = `${(sh - newH) / 2}px`;

  if (prevW > 0 && prevH > 0 && spriteX >= 0) {
    spriteX       = (spriteX / prevW) * newW;
    spriteY       = (spriteY / prevH) * newH;
    spriteTargetX = (spriteTargetX / prevW) * newW;
    spriteTargetY = (spriteTargetY / prevH) * newH;
    applySpriteCss();
  }
}

// ── Walkable-area geometry ────────────────────────────────

/** Ray-cast point-in-polygon (works for convex and concave polygons). */
function isInsidePolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    if ((yi > py) !== (yj > py) &&
        px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Nearest point on segment AB to point P. */
function nearestOnSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return [ax, ay];
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return [ax + t * dx, ay + t * dy];
}

/** Clamp a normalised 0-1 point to the walkable polygon. Returns [nx, ny]. */
function clampToWalkable(nx, ny) {
  if (isInsidePolygon(nx, ny, WALKABLE_POLYGON)) return [nx, ny];

  let bestDist = Infinity;
  let bestX = nx, bestY = ny;
  for (let i = 0, j = WALKABLE_POLYGON.length - 1; i < WALKABLE_POLYGON.length; j = i++) {
    const [cx, cy] = nearestOnSegment(
      nx, ny,
      WALKABLE_POLYGON[j][0], WALKABLE_POLYGON[j][1],
      WALKABLE_POLYGON[i][0], WALKABLE_POLYGON[i][1],
    );
    const d = Math.hypot(cx - nx, cy - ny);
    if (d < bestDist) { bestDist = d; bestX = cx; bestY = cy; }
  }
  return [bestX, bestY];
}

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

  // Ensure stage is sized now that roomScreen has layout
  resizeStage();

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
  if (!roomStage || !stageW) return;
  const rect = roomStage.getBoundingClientRect();

  // Convert viewport coords → stage-local px → normalised 0-1
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const nx = localX / stageW;
  const ny = localY / stageH;

  // Clamp to walkable polygon then convert back to stage px
  const [cx, cy] = clampToWalkable(nx, ny);
  const pad = SPRITE_FRAME_W / 2;
  spriteTargetX = Math.max(pad, Math.min(stageW - pad, cx * stageW));
  spriteTargetY = Math.max(pad, Math.min(stageH - pad, cy * stageH));
}

function initSprite() {
  if (!roomStage || !roomSprite || !stageW) return;
  spriteX       = stageW  * 0.5;
  spriteY       = stageH  * 0.68;
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
  roomStage       = document.querySelector("[data-room-stage]");
  roomBlurOverlay = document.querySelector("[data-room-blur-overlay]");
  roomItems       = Array.from(document.querySelectorAll("[data-room-item]"));
  roomSprite      = document.querySelector("[data-room-sprite]");

  roomItems.forEach((item) => {
    item.addEventListener("click", () => onItemClick(item.dataset.roomItem));
  });

  // Detect natural image dimensions → initial stage sizing
  const img = new Image();
  img.onload = () => {
    bgNaturalW = img.naturalWidth;
    bgNaturalH = img.naturalHeight;
    resizeStage();
  };
  img.src = BG_IMAGE_SRC;

  // Keep stage in sync with viewport changes
  if (roomScreen && typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => resizeStage()).observe(roomScreen);
  }
}
