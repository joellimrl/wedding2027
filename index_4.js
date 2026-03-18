import { mountCountdown } from "./countdown.js";

const scene = document.querySelector("[data-scene]");
const openDoorsButton = document.querySelector("[data-open-doors]");
const sections = document.getElementById("enchanted-sections");
const countdownRoot = document.getElementById("countdown_4");
const mapTrigger = document.querySelector("[data-map-trigger]");
const mapSpell = document.querySelector("[data-map-spell]");
const mapSheet = document.querySelector("[data-map-sheet]");
const portraitsTrigger = document.querySelector("[data-portraits-trigger]");
const portraitsGallery = document.querySelector("[data-portraits-gallery]");

const mapPhrase = "I solemnly swear we are gathering for good.";

mountCountdown({ root: countdownRoot });

let hasOpenedDoors = false;
let mapTypingTimer = null;
let hasTypedMapPhrase = false;

function openDoors() {
  if (!scene || hasOpenedDoors) {
    return;
  }

  hasOpenedDoors = true;
  scene.classList.add("is-open");

  window.setTimeout(() => {
    sections?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 1100);
}

function typeMapPhrase() {
  if (!mapSpell || !mapSheet) {
    return;
  }

  if (hasTypedMapPhrase) {
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
    mapSpell.textContent = mapPhrase.slice(0, index);

    if (index >= mapPhrase.length) {
      window.clearInterval(mapTypingTimer);
      mapTypingTimer = null;
      mapSheet.hidden = false;
      hasTypedMapPhrase = true;
    }
  }, 55);
}

function togglePortraits() {
  if (!portraitsGallery) {
    return;
  }

  const isHidden = portraitsGallery.hasAttribute("hidden");

  if (isHidden) {
    portraitsGallery.removeAttribute("hidden");
    portraitsGallery.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }

  portraitsGallery.setAttribute("hidden", "");
}

openDoorsButton?.addEventListener("click", openDoors);
mapTrigger?.addEventListener("click", typeMapPhrase);
portraitsTrigger?.addEventListener("click", togglePortraits);