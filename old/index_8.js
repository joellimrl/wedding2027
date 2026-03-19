import { mountCountdown } from "./countdown.js";

const experience = document.querySelector("[data-experience]");
const openingScene = document.querySelector("[data-opening-scene]");
const openingVideo = document.querySelector("[data-opening-video]");
const replayIntroButton = document.querySelector("[data-replay-intro]");
const countdownRoot = document.getElementById("countdown_8");
const modalTriggers = document.querySelectorAll("[data-modal-trigger]");
const popups = document.querySelectorAll("[data-popup]");
const popupCloseButtons = document.querySelectorAll("[data-popup-close]");

const STORAGE_KEY = "wedding2027-opening-played";

mountCountdown({ root: countdownRoot });

let activePopup = null;

function setIntroPlayingState(isPlaying) {
  experience?.classList.toggle("is-intro-playing", isPlaying);
}

function showMainHall() {
  setIntroPlayingState(false);
  experience?.classList.add("is-ready", "is-complete");
  openingScene?.setAttribute("aria-hidden", "true");
}

function markOpeningAsPlayed() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // Ignore storage failures and continue with the visual transition.
  }
}

function clearOpeningPlayed() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures and continue with the visual transition.
  }
}

function hasOpeningPlayed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function closePopup(popup = activePopup) {
  if (!popup) {
    return;
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

function startOpening() {
  playOpeningSequence();
}

function replayIntro() {
  if (!experience || !openingVideo) {
    return;
  }

  closePopup();
  clearOpeningPlayed();
  setIntroPlayingState(true);
  openingVideo.currentTime = 0;
  playOpeningSequence();
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
  startOpening();
}

replayIntroButton?.addEventListener("click", replayIntro);
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