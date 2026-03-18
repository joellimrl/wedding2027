const DEFAULT_TARGET_ISO = "2027-06-19T19:00:00+08:00";

function formatParts(distanceMs) {
  const totalSeconds = Math.max(0, Math.floor(distanceMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    { label: "Days", value: String(days).padStart(2, "0") },
    { label: "Hours", value: String(hours).padStart(2, "0") },
    { label: "Minutes", value: String(minutes).padStart(2, "0") },
    { label: "Seconds", value: String(seconds).padStart(2, "0") },
  ];
}

function renderCountdown(root, distanceMs) {
  const parts = formatParts(distanceMs);

  root.innerHTML = `
    <div class="countdownGrid" aria-live="polite">
      ${parts
        .map(
          (part) => `
            <div class="countdownUnit">
              <span class="countdownValue">${part.value}</span>
              <span class="countdownLabel">${part.label}</span>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderComplete(root) {
  root.innerHTML = `
    <div class="countdownComplete" aria-live="polite">
      <span class="countdownCompleteTitle">We’re married!</span>
      <span class="countdownCompleteBody">Thank you for celebrating with us.</span>
    </div>
  `;
}

export function mountCountdown({ root, targetISO = DEFAULT_TARGET_ISO, nowProvider = () => Date.now() }) {
  if (!root) {
    throw new Error("mountCountdown requires a root element.");
  }

  const targetTime = new Date(targetISO).getTime();

  if (Number.isNaN(targetTime)) {
    throw new Error(`Invalid countdown target: ${targetISO}`);
  }

  let timerId = null;

  const update = () => {
    const distanceMs = targetTime - nowProvider();

    if (distanceMs <= 0) {
      renderComplete(root);

      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }

      return;
    }

    renderCountdown(root, distanceMs);
  };

  update();
  timerId = window.setInterval(update, 1000);

  return () => {
    if (timerId !== null) {
      clearInterval(timerId);
    }
  };
}

export { DEFAULT_TARGET_ISO };