// feat/map/map.js — Marauder's Map: fold-open animation, quill reveal, blank stage

import { hasMapPlayed, markMapPlayed, clearMapPlayed } from "../shared/storage.js";

const MAP_STROKE_DASH     = 2400;
const MAP_INTRO_DURATION  = 1420;
const MAP_REVEAL_DURATION = 2880;
const MAP_BLANK_DELAY     = 800;
const MAP_QUILL_OFFSET_X  = 18;
const MAP_QUILL_OFFSET_Y  = 46;

// DOM refs — populated by initMap() after fragments are injected
let mapSurface      = null;
let mapIntroStage   = null;
let mapWritingStage = null;
let mapBlankStage   = null;
let mapSpellSvg     = null;
let mapLineTexts    = [];
let mapQuill        = null;
let replayMapBtn    = null;

// State
let mapAnimationFrameId = null;
let mapBlankTimeoutId   = null;
let mapIntroTimeoutId   = null;
let mapRevealStartedAt  = 0;
let mapLineMetrics      = [];

// ── Surface state ─────────────────────────────────────────

function setMapSurfaceState(state) {
  if (!mapSurface) return;
  mapSurface.classList.toggle("is-map-intro-active",   state === "intro");
  mapSurface.classList.toggle("is-map-writing-active", state === "writing");
  mapSurface.classList.toggle("is-map-blank-active",   state === "blank");
}

// ── Stroke draw helpers ───────────────────────────────────

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

// ── Timer management ──────────────────────────────────────

function clearMapTimers() {
  if (mapAnimationFrameId !== null) { window.cancelAnimationFrame(mapAnimationFrameId); mapAnimationFrameId = null; }
  if (mapBlankTimeoutId   !== null) { window.clearTimeout(mapBlankTimeoutId);           mapBlankTimeoutId   = null; }
  if (mapIntroTimeoutId   !== null) { window.clearTimeout(mapIntroTimeoutId);           mapIntroTimeoutId   = null; }
}

// ── Stage transitions ─────────────────────────────────────

function showBlankMapStage() {
  clearMapTimers();
  mapRevealStartedAt = 0;
  setMapSurfaceState("blank");
  if (mapIntroStage)   { mapIntroStage.hidden   = true;  mapIntroStage.setAttribute("aria-hidden", "true"); }
  if (mapWritingStage) { mapWritingStage.hidden  = true;  mapWritingStage.setAttribute("aria-hidden", "true"); }
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

function getMapIntroDuration() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : MAP_INTRO_DURATION;
}

function startMapReveal() {
  const introDuration = getMapIntroDuration();
  resetMapRevealState();
  setMapIntroMotionOrigin();

  if (!introDuration) { startMapWritingSequence(); return; }
  mapIntroTimeoutId = window.setTimeout(() => { mapIntroTimeoutId = null; startMapWritingSequence(); }, introDuration);
}

// ── Panel lifecycle ───────────────────────────────────────

export function handleMapPanelOpen() {
  if (hasMapPlayed()) { showBlankMapStage(); return; }
  startMapReveal();
}

export function handleMapPanelClose() {
  clearMapTimers();
  if (hasMapPlayed()) { showBlankMapStage(); return; }
  resetMapRevealState();
}

// ── Init ──────────────────────────────────────────────────

export function initMap() {
  // Query DOM now that the fragment has been injected
  mapSurface      = document.querySelector("[data-map-surface]");
  mapIntroStage   = document.querySelector("[data-map-intro-stage]");
  mapWritingStage = document.querySelector("[data-map-writing-stage]");
  mapBlankStage   = document.querySelector("[data-map-blank-stage]");
  mapSpellSvg     = document.querySelector("[data-map-spell-svg]");
  mapLineTexts    = Array.from(document.querySelectorAll("[data-map-line-text]"));
  mapQuill        = document.querySelector("[data-map-quill]");
  replayMapBtn    = document.querySelector("[data-replay-map]");

  replayMapBtn?.addEventListener("click", () => {
    clearMapPlayed();
    startMapReveal();
  });
}
