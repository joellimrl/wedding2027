import { mountCountdown } from "../countdown.js";

const RSVP_URL = "https://example.com/rsvp";
const MAP_PHRASE = "I solemnly swear I am up to no good";

const scene = document.querySelector("[data-scene]");
const enterHallButton = document.querySelector("[data-enter-hall]");
const mapTrigger = document.querySelector("[data-map-trigger]");
const mapPanel = document.querySelector("[data-map-panel]");
const mapClose = document.querySelector("[data-map-close]");
const mapSpell = document.querySelector("[data-map-spell]");
const mapSheet = document.querySelector("[data-map-sheet]");
const portraitsTrigger = document.querySelector("[data-portraits-trigger]");
const portraitsModal = document.querySelector("[data-portraits-modal]");
const portraitsClose = document.querySelector("[data-portraits-close]");
const rsvpTrigger = document.querySelector("[data-rsvp-trigger]");
const owlOverlay = document.querySelector("[data-owl-overlay]");
const countdownRoot = document.getElementById("countdown_6");

mountCountdown({ root: countdownRoot });

let hasEnteredHall = false;
let hasTypedMapPhrase = false;
let mapTypingTimer = null;
let isRsvpRedirecting = false;

function openMapPanel() {
  if (!mapPanel) {
    return;
  }

  mapPanel.hidden = false;
}

function closeMapPanel() {
  if (!mapPanel) {
    return;
  }

  if (mapTypingTimer !== null) {
    window.clearInterval(mapTypingTimer);
    mapTypingTimer = null;
    mapSpell.textContent = "";
  }

  mapPanel.hidden = true;
}

function typeMapPhrase() {
  if (!mapSpell || !mapSheet) {
    return;
  }

  openMapPanel();

  if (hasTypedMapPhrase) {
    mapSpell.textContent = MAP_PHRASE;
    mapSheet.hidden = false;
    return;
  }

  if (mapTypingTimer !== null) {
    window.clearInterval(mapTypingTimer);
  }

  mapSpell.textContent = "";
  mapSheet.hidden = true;

  let index = 0;
  mapTypingTimer = window.setInterval(() => {
    index += 1;
    mapSpell.textContent = MAP_PHRASE.slice(0, index);

    if (index >= MAP_PHRASE.length) {
      window.clearInterval(mapTypingTimer);
      mapTypingTimer = null;
      mapSheet.hidden = false;
      hasTypedMapPhrase = true;
    }
  }, 55);
}

function closePortraits() {
  if (!portraitsModal) {
    return;
  }

  portraitsModal.hidden = true;
}

function openPortraits() {
  if (!portraitsModal) {
    return;
  }

  portraitsModal.hidden = false;
}

function enterHall() {
  if (!scene || hasEnteredHall) {
    return;
  }

  hasEnteredHall = true;
  scene.classList.add("is-entered");
  enterHallButton?.setAttribute("aria-disabled", "true");

  window.setTimeout(() => {
    mapTrigger?.focus();
  }, 1400);
}

function handleRsvpTransition() {
  if (!owlOverlay || isRsvpRedirecting) {
    return;
  }

  isRsvpRedirecting = true;
  owlOverlay.hidden = false;

  window.setTimeout(() => {
    window.location.assign(RSVP_URL);
  }, 1350);
}

function handleGlobalKeydown(event) {
  if (event.key !== "Escape") {
    return;
  }

  closeMapPanel();
  closePortraits();
}

enterHallButton?.addEventListener("click", enterHall);
mapTrigger?.addEventListener("click", typeMapPhrase);
mapClose?.addEventListener("click", closeMapPanel);
portraitsTrigger?.addEventListener("click", openPortraits);
portraitsClose?.addEventListener("click", closePortraits);
rsvpTrigger?.addEventListener("click", handleRsvpTransition);
window.addEventListener("keydown", handleGlobalKeydown);

mapPanel?.addEventListener("click", (event) => {
  if (event.target === mapPanel) {
    closeMapPanel();
  }
});

portraitsModal?.addEventListener("click", (event) => {
  if (event.target === portraitsModal) {
    closePortraits();
  }
});