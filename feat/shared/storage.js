// feat/shared/storage.js — localStorage helpers and persistent-state constants
// Imported by features that need to read/write app state.

export const HP_HAS_VISITED_KEY     = "HP_HAS_VISITED";
export const HP_LOCKOUT_UNTIL_KEY   = "HP_LOCKOUT_UNTIL";
export const HP_FIRST_RSVP_SEEN_KEY = "HP_FIRST_RSVP_SEEN";
export const HP_MAP_PLAYED_KEY      = "HP_MAP_PLAYED";
export const HP_MUSIC_MUTED_KEY     = "HP_MUSIC_MUTED";

export const MAX_PASSWORD_ATTEMPTS = 3;
export const LOCKOUT_DURATION_MS   = 24 * 60 * 60 * 1000;

export function lsGet(key) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

export function lsSet(key, value) {
  try { window.localStorage.setItem(key, String(value)); } catch { /* ignore */ }
}

export function lsRemove(key) {
  try { window.localStorage.removeItem(key); } catch { /* ignore */ }
}

export function hasVisited()       { return lsGet(HP_HAS_VISITED_KEY) === "true"; }
export function markVisited()      { lsSet(HP_HAS_VISITED_KEY, "true"); }
export function hasSeenFirstRsvp() { return lsGet(HP_FIRST_RSVP_SEEN_KEY) === "true"; }
export function markFirstRsvp()    { lsSet(HP_FIRST_RSVP_SEEN_KEY, "true"); }
export function hasMapPlayed()     { return lsGet(HP_MAP_PLAYED_KEY) === "true"; }
export function markMapPlayed()    { lsSet(HP_MAP_PLAYED_KEY, "true"); }
export function clearMapPlayed()   { lsRemove(HP_MAP_PLAYED_KEY); }

export function getLockoutUntil() {
  const v = lsGet(HP_LOCKOUT_UNTIL_KEY);
  return v ? parseInt(v, 10) : 0;
}

export function setLockout() {
  lsSet(HP_LOCKOUT_UNTIL_KEY, Date.now() + LOCKOUT_DURATION_MS);
}

export function isLockedOut() {
  const until = getLockoutUntil();
  return until > 0 && Date.now() < until;
}
