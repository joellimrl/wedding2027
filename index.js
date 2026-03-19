import { mountCountdown } from "./countdown.js";

const experience = document.querySelector("[data-experience]");
const openingScene = document.querySelector("[data-opening-scene]");
const openingVideo = document.querySelector("[data-opening-video]");
const mainHall = document.querySelector("[data-main-hall]");
const replayIntroLayer = document.querySelector(".replayIntroLayer");
const replayIntroButton = document.querySelector("[data-replay-intro]");
const countdownRoot = document.getElementById("countdown");
const modalTriggers = document.querySelectorAll("[data-modal-trigger]");
const popups = document.querySelectorAll("[data-popup]");
const popupCloseButtons = document.querySelectorAll("[data-popup-close]");
const mapPopup = document.querySelector('[data-popup="map-modal"]');
const replayMapButton = document.querySelector("[data-replay-map]");
const mapWritingStage = document.querySelector("[data-map-writing-stage]");
const mapBlankStage = document.querySelector("[data-map-blank-stage]");
const mapSpellSvg = document.querySelector("[data-map-spell-svg]");
const mapLineTexts = Array.from(document.querySelectorAll("[data-map-line-text]"));
const mapQuill = document.querySelector("[data-map-quill]");

const INTRO_STORAGE_KEY = "wedding2027-home-opening-played";
const MAP_STORAGE_KEY = "wedding2027-map-opening-played";
const MAP_STROKE_DASH = 2400;
const MAP_REVEAL_DURATION = 2880;
const MAP_BLANK_DELAY = 800;
const MAP_QUILL_OFFSET_X = 18;
const MAP_QUILL_OFFSET_Y = 46;

mountCountdown({ root: countdownRoot });

let activePopup = null;
let mapAnimationFrameId = null;
let mapBlankTimeoutId = null;
let mapRevealStartedAt = 0;
let mapLineMetrics = [];

function updateReplayIntroVisibility() {
  if (!replayIntroLayer) {
    return;
  }

  const shouldHideOnMobile =
    window.matchMedia("(max-width: 640px)").matches && (mainHall?.scrollTop ?? 0) > 0;

  replayIntroLayer.classList.toggle("is-hidden-on-mobile-scroll", shouldHideOnMobile);
}

function setIntroPlayingState(isPlaying) {
  experience?.classList.toggle("is-intro-playing", isPlaying);
}

function showMainHall() {
  setIntroPlayingState(false);
  experience?.classList.add("is-ready", "is-complete");
  openingScene?.setAttribute("aria-hidden", "true");
  updateReplayIntroVisibility();
}

function markOpeningAsPlayed() {
  try {
    window.localStorage.setItem(INTRO_STORAGE_KEY, "true");
  } catch {
    // Ignore storage failures and continue with the visual transition.
  }
}

function clearOpeningPlayed() {
  try {
    window.localStorage.removeItem(INTRO_STORAGE_KEY);
  } catch {
    // Ignore storage failures and continue with the visual transition.
  }
}

function hasOpeningPlayed() {
  try {
    return window.localStorage.getItem(INTRO_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function markMapRevealAsPlayed() {
  try {
    window.localStorage.setItem(MAP_STORAGE_KEY, "true");
  } catch {
    // Ignore storage failures and continue with the visual transition.
  }
}

function clearMapRevealPlayed() {
  try {
    window.localStorage.removeItem(MAP_STORAGE_KEY);
  } catch {
    // Ignore storage failures and continue with the visual transition.
  }
}

function hasMapRevealPlayed() {
  try {
    return window.localStorage.getItem(MAP_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function clearMapAnimationFrame() {
  if (mapAnimationFrameId !== null) {
    window.cancelAnimationFrame(mapAnimationFrameId);
    mapAnimationFrameId = null;
  }
}

function clearMapBlankTimeout() {
  if (mapBlankTimeoutId !== null) {
    window.clearTimeout(mapBlankTimeoutId);
    mapBlankTimeoutId = null;
  }
}

function setMapLineStrokeProgress(lineText, progress) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  lineText.style.strokeDasharray = `${MAP_STROKE_DASH}`;
  lineText.style.strokeDashoffset = `${MAP_STROKE_DASH * (1 - clampedProgress)}`;
  lineText.style.setProperty("--map-fill-opacity", `${clampedProgress * 0.18}`);
}

function getMapLineMetrics() {
  if (!mapLineTexts.length) {
    return [];
  }

  if (mapLineMetrics.length === mapLineTexts.length) {
    return mapLineMetrics;
  }

  const totalCharacters = mapLineTexts.reduce((count, lineText) => {
    return count + Math.max(lineText.textContent?.length ?? 0, 1);
  }, 0);

  let runningCharacters = 0;

  mapLineMetrics = mapLineTexts.map((lineText) => {
    const value = lineText.textContent ?? "";
    const characterCount = Math.max(value.length, 1);
    const startProgress = runningCharacters / totalCharacters;

    runningCharacters += characterCount;

    return {
      lineText,
      value,
      characterCount,
      startProgress,
      endProgress: runningCharacters / totalCharacters,
    };
  });

  return mapLineMetrics;
}

function getSvgPointCoordinates(point) {
  return { x: point.x, y: point.y };
}

function getCharacterAnchor(lineText, characterIndex, anchor) {
  try {
    if (anchor === "start") {
      return getSvgPointCoordinates(lineText.getStartPositionOfChar(characterIndex));
    }

    return getSvgPointCoordinates(lineText.getEndPositionOfChar(characterIndex));
  } catch {
    try {
      const extent = lineText.getExtentOfChar(characterIndex);

      return {
        x: anchor === "start" ? extent.x : extent.x + extent.width,
        y: extent.y + extent.height * 0.72,
      };
    } catch {
      return null;
    }
  }
}

function interpolatePoint(startPoint, endPoint, progress) {
  return {
    x: startPoint.x + (endPoint.x - startPoint.x) * progress,
    y: startPoint.y + (endPoint.y - startPoint.y) * progress,
  };
}

function findNearestCharacterAnchor(lineText, value, startIndex, step, anchor) {
  for (let index = startIndex; index >= 0 && index < value.length; index += step) {
    if (value[index]?.trim()) {
      return getCharacterAnchor(lineText, index, anchor);
    }
  }

  return null;
}

function getCharacterPoint(lineMetric, characterIndex, progressWithinCharacter) {
  const { lineText, value, characterCount } = lineMetric;
  const safeIndex = Math.min(Math.max(characterIndex, 0), characterCount - 1);
  const safeProgress = Math.min(Math.max(progressWithinCharacter, 0), 1);
  const currentCharacter = value[safeIndex] ?? "";

  if (!currentCharacter.trim()) {
    const previousPoint = findNearestCharacterAnchor(lineText, value, safeIndex - 1, -1, "end");
    const nextPoint = findNearestCharacterAnchor(lineText, value, safeIndex + 1, 1, "start");

    if (previousPoint && nextPoint) {
      return interpolatePoint(previousPoint, nextPoint, safeProgress);
    }

    return previousPoint ?? nextPoint ?? { x: 0, y: 0 };
  }

  const startPoint = getCharacterAnchor(lineText, safeIndex, "start");
  const endPoint = getCharacterAnchor(lineText, safeIndex, "end");

  if (startPoint && endPoint) {
    return interpolatePoint(startPoint, endPoint, safeProgress);
  }

  return startPoint ?? endPoint ?? { x: 0, y: 0 };
}

function setMapQuillPosition(point, angle) {
  if (!mapQuill || !mapSpellSvg) {
    return;
  }

  const viewBox = mapSpellSvg.viewBox.baseVal;
  const svgBounds = mapSpellSvg.getBoundingClientRect();

  if (!svgBounds.width || !svgBounds.height || !viewBox.width || !viewBox.height) {
    return;
  }

  const x = ((point.x - viewBox.x) / viewBox.width) * svgBounds.width;
  const y = ((point.y - viewBox.y) / viewBox.height) * svgBounds.height;

  mapQuill.style.transform = `translate(${x - MAP_QUILL_OFFSET_X}px, ${y - MAP_QUILL_OFFSET_Y}px) rotate(${angle}deg)`;
}

function positionMapQuill(progress) {
  const lineMetrics = getMapLineMetrics();

  if (!lineMetrics.length || !mapQuill) {
    return;
  }

  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const activeLine =
    lineMetrics.find((lineMetric) => clampedProgress <= lineMetric.endProgress) ??
    lineMetrics[lineMetrics.length - 1];
  const lineSpan = Math.max(activeLine.endProgress - activeLine.startProgress, Number.EPSILON);
  const lineProgress = Math.min(Math.max((clampedProgress - activeLine.startProgress) / lineSpan, 0), 1);
  const scaledCharacterProgress = lineProgress * activeLine.characterCount;
  const characterIndex = Math.min(Math.floor(scaledCharacterProgress), activeLine.characterCount - 1);
  const progressWithinCharacter = scaledCharacterProgress - characterIndex;
  const currentPoint = getCharacterPoint(activeLine, characterIndex, progressWithinCharacter);
  const nextPoint = getCharacterPoint(
    activeLine,
    characterIndex,
    Math.min(progressWithinCharacter + 0.15, 1),
  );
  const angle = Math.atan2(nextPoint.y - currentPoint.y, nextPoint.x - currentPoint.x) * (180 / Math.PI);

  setMapQuillPosition(currentPoint, angle);
}

function updateMapRevealProgress(progress) {
  const lineMetrics = getMapLineMetrics();

  if (!lineMetrics.length) {
    return;
  }

  lineMetrics.forEach((lineMetric) => {
    const lineSpan = Math.max(lineMetric.endProgress - lineMetric.startProgress, Number.EPSILON);
    const lineProgress = (progress - lineMetric.startProgress) / lineSpan;

    setMapLineStrokeProgress(lineMetric.lineText, lineProgress);
  });

  positionMapQuill(progress);
}

function clearMapRevealTimers() {
  clearMapAnimationFrame();
  clearMapBlankTimeout();
}

function completeMapReveal() {
  clearMapAnimationFrame();
  updateMapRevealProgress(1);
  markMapRevealAsPlayed();
  mapBlankTimeoutId = window.setTimeout(() => {
    showBlankMapPopup();
  }, MAP_BLANK_DELAY);
}

function animateMapReveal(timestamp) {
  if (!mapSpellSvg || !mapLineTexts.length || !mapQuill) {
    showBlankMapPopup();
    return;
  }

  if (!mapRevealStartedAt) {
    mapRevealStartedAt = timestamp;
  }

  const progress = Math.min((timestamp - mapRevealStartedAt) / MAP_REVEAL_DURATION, 1);

  updateMapRevealProgress(progress);

  if (progress >= 1) {
    completeMapReveal();
    return;
  }

  mapAnimationFrameId = window.requestAnimationFrame(animateMapReveal);
}

function resetMapRevealState() {
  clearMapRevealTimers();
  mapRevealStartedAt = 0;

  if (mapWritingStage) {
    mapWritingStage.hidden = false;
    mapWritingStage.setAttribute("aria-hidden", "false");
  }

  if (mapBlankStage) {
    mapBlankStage.hidden = true;
    mapBlankStage.setAttribute("aria-hidden", "true");
  }

  mapLineTexts.forEach((lineText) => {
    setMapLineStrokeProgress(lineText, 0);
  });

  positionMapQuill(0);
}

function showBlankMapPopup() {
  clearMapRevealTimers();
  mapRevealStartedAt = 0;

  if (mapWritingStage) {
    mapWritingStage.hidden = true;
    mapWritingStage.setAttribute("aria-hidden", "true");
  }

  if (mapBlankStage) {
    mapBlankStage.hidden = false;
    mapBlankStage.setAttribute("aria-hidden", "false");
  }
}

function runMapReveal() {
  if (!mapSpellSvg || !mapLineTexts.length || !mapQuill) {
    showBlankMapPopup();
    return;
  }

  clearMapRevealTimers();
  mapRevealStartedAt = 0;
  mapAnimationFrameId = window.requestAnimationFrame(animateMapReveal);
}

function startMapReveal() {
  resetMapRevealState();
  runMapReveal();
}

function handleMapPopupOpen() {
  if (!mapPopup) {
    return;
  }

  if (hasMapRevealPlayed()) {
    showBlankMapPopup();
    return;
  }

  startMapReveal();
}

function handleMapPopupClose() {
  clearMapRevealTimers();

  if (hasMapRevealPlayed()) {
    showBlankMapPopup();
    return;
  }

  resetMapRevealState();
}

function closePopup(popup = activePopup) {
  if (!popup) {
    return;
  }

  if (popup === mapPopup) {
    handleMapPopupClose();
  }

  popup.hidden = true;

  if (activePopup === popup) {
    activePopup = null;
  }
}

function openPopup(popupName) {
  const popup = document.querySelector(`[data-popup="${popupName}"]`);

  if (!popup) {
    return;
  }

  if (activePopup && activePopup !== popup) {
    closePopup(activePopup);
  }

  popup.hidden = false;
  activePopup = popup;

  if (popup === mapPopup) {
    handleMapPopupOpen();
  }
}

function completeOpening(shouldPersist = true) {
  setIntroPlayingState(false);

  if (shouldPersist) {
    markOpeningAsPlayed();
  }

  showMainHall();
}

function playOpeningSequence() {
  if (!experience || !openingVideo) {
    showMainHall();
    return;
  }

  setIntroPlayingState(true);
  experience.classList.add("is-ready");
  experience.classList.remove("is-complete");
  openingScene?.removeAttribute("aria-hidden");

  openingVideo.onended = () => completeOpening(true);
  openingVideo.onerror = () => completeOpening(false);

  const playAttempt = openingVideo.play();

  if (playAttempt instanceof Promise) {
    playAttempt.catch(() => {
      completeOpening(false);
    });
  }
}

function replayIntro() {
  if (!experience || !openingVideo) {
    return;
  }

  closePopup();
  clearOpeningPlayed();
  setIntroPlayingState(true);
  mainHall?.scrollTo({ top: 0, behavior: "auto" });
  updateReplayIntroVisibility();
  openingVideo.currentTime = 0;
  playOpeningSequence();
}

function replayMap() {
  if (!mapPopup || mapPopup.hidden) {
    return;
  }

  clearMapRevealPlayed();
  startMapReveal();
}

function handleGlobalKeydown(event) {
  if (event.key !== "Escape") {
    return;
  }

  closePopup();
}

if (hasOpeningPlayed()) {
  showMainHall();
} else {
  playOpeningSequence();
}

replayIntroButton?.addEventListener("click", replayIntro);
replayMapButton?.addEventListener("click", replayMap);
mainHall?.addEventListener("scroll", updateReplayIntroVisibility, { passive: true });
window.addEventListener("resize", updateReplayIntroVisibility);
modalTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    openPopup(trigger.dataset.modalTrigger);
  });
});

popupCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closePopup(button.closest("[data-popup]"));
  });
});

popups.forEach((popup) => {
  popup.addEventListener("click", (event) => {
    if (event.target === popup) {
      closePopup(popup);
    }
  });
});

window.addEventListener("keydown", handleGlobalKeydown);
updateReplayIntroVisibility();