// feat/password/password.js — Gate screen, Fat Lady typewriter, password logic, door swing

import {
  MAX_PASSWORD_ATTEMPTS,
  lsSet,
  isLockedOut,
  setLockout,
  markVisited,
} from "../shared/storage.js";

const PASSWORD = "wedding";

// DOM refs — populated by initPassword() after fragments are injected
let gateScreen     = null;
let fatLadyText    = null;
let fatLadyImg     = null;
let passwordForm   = null;
let passwordInput  = null;
let passwordError  = null;
let lockoutMessage = null;
let doorSwing      = null;

// Module state
let passwordAttempts = 0;
let _onAuthenticated = null;

// ── Typewriter helper ──────────────────────────────────────

function typeText(element, text, speedMs = 42) {
  return new Promise((resolve) => {
    element.textContent = "";
    let i = 0;
    const tick = () => {
      element.textContent += text[i];
      i++;
      if (i < text.length) {
        setTimeout(tick, speedMs);
      } else {
        resolve();
      }
    };
    setTimeout(tick, speedMs);
  });
}

// ── Gate screen ────────────────────────────────────────────

export function showGateScreen() {
  if (!gateScreen) return;
  gateScreen.hidden = false;

  if (isLockedOut()) {
    showLockout();
    return;
  }

  typeText(fatLadyText, "Welcome sorcerer, are you ready?").then(() => {
    if (passwordForm) {
      passwordForm.hidden = false;
      passwordInput?.focus();
    }
  });
}

function showLockout() {
  if (passwordForm) passwordForm.hidden = true;
  if (lockoutMessage) lockoutMessage.hidden = false;
}

function showPasswordError(message) {
  if (!passwordError) return;
  passwordError.textContent = message;
  passwordError.hidden = false;
  // Re-trigger shake animation
  passwordError.style.animation = "none";
  void passwordError.offsetHeight; // force reflow
  passwordError.style.animation = "";
}

function hidePasswordError() {
  if (!passwordError) return;
  passwordError.hidden = true;
  passwordError.textContent = "";
}

async function handlePasswordSubmit(event) {
  event.preventDefault();
  if (!passwordInput) return;

  const value = passwordInput.value.trim().toLowerCase();

  if (value !== PASSWORD) {
    passwordAttempts++;
    passwordInput.value = "";

    if (passwordAttempts >= MAX_PASSWORD_ATTEMPTS) {
      setLockout();
      await typeText(fatLadyText, "You shall not pass! Come back tomorrow.");
      showLockout();
      return;
    }

    await typeText(fatLadyText, "Oh no! That's not the password, try again!");
    showPasswordError(`${MAX_PASSWORD_ATTEMPTS - passwordAttempts} attempt(s) remaining`);
    passwordInput.focus();
    return;
  }

  // Correct password
  hidePasswordError();
  markVisited();
  await typeText(fatLadyText, "Very well… enter.");
  openDoor();
}

function openDoor() {
  const portrait = document.querySelector(".fatLadyPortrait");
  if (portrait) portrait.classList.add("is-swinging");

  if (doorSwing) {
    doorSwing.hidden = false;
    setTimeout(() => doorSwing.classList.add("is-open"), 200);
  }

  setTimeout(() => {
    if (gateScreen) gateScreen.hidden = true;
    if (doorSwing)  doorSwing.hidden = true;
    doorSwing?.classList.remove("is-open");
    _onAuthenticated?.();
  }, 1300);
}

// ── Init ──────────────────────────────────────────────────

/**
 * @param {object} options
 * @param {function} options.onAuthenticated - called after door animation completes
 */
export function initPassword({ onAuthenticated }) {
  _onAuthenticated = onAuthenticated;

  // Query DOM now that the fragment has been injected
  gateScreen     = document.querySelector("[data-gate-screen]");
  fatLadyText    = document.querySelector("[data-fat-lady-text]");
  fatLadyImg     = document.querySelector("[data-fat-lady-img]");
  passwordForm   = document.querySelector("[data-password-form]");
  passwordInput  = document.querySelector("[data-password-input]");
  passwordError  = document.querySelector("[data-password-error]");
  lockoutMessage = document.querySelector("[data-lockout-message]");
  doorSwing      = document.querySelector("[data-door-swing]");

  passwordForm?.addEventListener("submit", handlePasswordSubmit);

  passwordInput?.addEventListener("input", () => {
    if (!fatLadyImg) return;
    fatLadyImg.src = passwordInput.value.length === 0
      ? "./assets/fat_lady_password_clear.jpg"
      : "./assets/fat_lady_password_ask.jpg";
  });
}
