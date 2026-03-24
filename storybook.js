const modalTriggers = document.querySelectorAll("[data-modal-trigger]");
const popups = document.querySelectorAll("[data-popup]");
const closeButtons = document.querySelectorAll("[data-popup-close]");

let activePopup = null;

function openPopup(popup) {
  if (!popup) {
    return;
  }

  if (activePopup && activePopup !== popup) {
    closePopup(activePopup);
  }

  popup.hidden = false;
  activePopup = popup;
  document.body.classList.add("has-modal-open");
}

function closePopup(popup) {
  if (!popup) {
    return;
  }

  popup.hidden = true;

  if (activePopup === popup) {
    activePopup = null;
    document.body.classList.remove("has-modal-open");
  }
}

modalTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const popupId = trigger.dataset.modalTrigger;
    const popup = document.querySelector(`[data-popup="${popupId}"]`);
    openPopup(popup);
  });
});

closeButtons.forEach((button) => {
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && activePopup) {
    closePopup(activePopup);
  }
});