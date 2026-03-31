// feat/pensieve/pensieve.js — Pensieve memories panel
// The ripple animation is CSS-driven (triggers via :not([hidden]) selector).
// No feature-specific JS logic beyond shared panel open/close framework.

export function handlePensievePanelOpen() {
  // CSS handles the ripple expand animation automatically when the panel
  // transitions from hidden to visible via [data-panel="pensieve"]:not([hidden])
}
