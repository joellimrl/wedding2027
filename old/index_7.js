const scene = document.querySelector("[data-scene]");
const gateTrigger = document.querySelector("[data-gate-trigger]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const ANIMATION_DURATION_MS = 2400;

let hasOpened = false;
let frameId = 0;

function easeInOutCubic(value) {
  if (value < 0.5) {
    return 4 * value * value * value;
  }

  return 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function setTravelProgress(progress) {
  scene?.style.setProperty("--travel", progress.toFixed(4));
}

function finishEntrance() {
  setTravelProgress(1);
  scene?.classList.add("is-open");
  gateTrigger?.setAttribute("aria-disabled", "true");
  gateTrigger?.blur();
}

function animateEntrance() {
  if (!scene) {
    return;
  }

  if (prefersReducedMotion.matches) {
    finishEntrance();
    return;
  }

  const startTime = performance.now();

  const step = (timestamp) => {
    const elapsed = timestamp - startTime;
    const rawProgress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
    const easedProgress = easeInOutCubic(rawProgress);

    setTravelProgress(easedProgress);

    if (rawProgress < 1) {
      frameId = window.requestAnimationFrame(step);
      return;
    }

    finishEntrance();
  };

  frameId = window.requestAnimationFrame(step);
}

function handleGateClick() {
  if (hasOpened) {
    return;
  }

  hasOpened = true;
  scene?.classList.add("is-opening");
  animateEntrance();
}

gateTrigger?.addEventListener("click", handleGateClick);

window.addEventListener("beforeunload", () => {
  if (frameId) {
    window.cancelAnimationFrame(frameId);
  }
});