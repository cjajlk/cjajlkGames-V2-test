const playBtn = document.getElementById("playBtn");
const tutorialBtn = document.getElementById("tutorialBtn");
const shopBtn = document.getElementById("shopBtn");
const stableBtn = document.getElementById("stableBtn");
const collectionBtn = document.getElementById("collectionBtn");
const optionsBtn = document.getElementById("optionsBtn");
const optionsPanel = document.getElementById("optionsPanel");
const closeOptions = document.getElementById("closeOptions");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const resetProfileBtn = document.getElementById("resetProfileBtn");
const eventText = document.getElementById("eventText");
const optionsTitle = document.getElementById("optionsTitle");
const languageLabel = document.getElementById("languageLabel");
const fullscreenLabel = document.getElementById("fullscreenLabel");
const resetLabel = document.getElementById("resetLabel");
const resetWarn = document.getElementById("resetWarn");
const rightsText = document.getElementById("rightsText");


// ============================
// 🎮 BOUTON JOUER → CAMPAGNE
// ============================

if (playBtn) {
    playBtn.addEventListener("click", () => {

        // petite sensation douce (optionnel mais joli)
        playBtn.style.transform = "scale(0.95)";

        setTimeout(() => {
            window.location.href = "campaign.html";
        }, 120);
    });
}


// 📚 Tutoriel
if (tutorialBtn) {
    tutorialBtn.addEventListener("click", () => {
        tutorialBtn.style.transform = "scale(0.95)";
        setTimeout(() => {
            window.location.href = "tutorial.html";
        }, 120);
    });
}



// 🛍 Boutique
shopBtn.onclick = () => {
  window.location.href = "shop.html";
};


// 🌿 Écurie (mascottes)
stableBtn.onclick = () => {
    window.location.href = "../pages/ecurie.html";
};

// 📚 Collection
collectionBtn.onclick = () => {
    window.location.href = "../pages/collection.html";
};



// ⚙ Options
const getCurrentLang = () => (window.I18n ? window.I18n.getLanguage() : "fr");

function updateLanguageButtons(lang) {
  const langButtons = document.querySelectorAll("[data-lang]");
  langButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

function updateFullscreenLabel(lang) {
  if (!fullscreenBtn) return;
  fullscreenBtn.textContent = document.fullscreenElement ? i18nT("options.fullscreenOff") : i18nT("options.fullscreenOn");
}

function openOptions() {
  if (!optionsPanel) return;
  optionsPanel.classList.remove("hidden");
  optionsPanel.setAttribute("aria-hidden", "false");
}

function closeOptionsPanel() {
  if (!optionsPanel) return;
  optionsPanel.classList.add("hidden");
  optionsPanel.setAttribute("aria-hidden", "true");
}

if (optionsBtn) {
  optionsBtn.onclick = openOptions;
}

if (closeOptions) {
  closeOptions.addEventListener("click", closeOptionsPanel);
}

if (optionsPanel) {
  optionsPanel.addEventListener("click", (e) => {
    if (e.target === optionsPanel) closeOptionsPanel();
  });
}

document.querySelectorAll("[data-lang]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const lang = btn.dataset.lang || "fr";
    if (window.I18n) window.I18n.setLanguage(lang);
    updateLanguageButtons(lang);
    updateFullscreenLabel(lang);
  });
});

if (fullscreenBtn) {
  fullscreenBtn.addEventListener("click", async () => {
    const lang = getCurrentLang();
    try {
      if (!document.fullscreenEnabled) {
        if (window.Popup && window.Popup.notify) {
          window.Popup.notify(i18nT("options.fullscreenUnsupported"), "error");
        }
        return;
      }
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        localStorage.setItem("breakerFullscreenEnabled", "false");
      } else {
        await document.documentElement.requestFullscreen();
        localStorage.setItem("breakerFullscreenEnabled", "true");
      }
      updateFullscreenLabel(lang);
    } catch (err) {
      console.warn("Fullscreen error:", err);
    }
  });
}

if (resetProfileBtn) {
  resetProfileBtn.addEventListener("click", () => {
    const lang = getCurrentLang();
    const message = `${i18nT("options.resetWarn")}\n\n${i18nT("options.resetConfirmTitle")}`;

    const confirmReset = () => {
      localStorage.removeItem("breaker_profile");
      localStorage.removeItem("breakerXP");
      localStorage.removeItem("breakerHighScore");
      window.location.reload();
    };

    if (window.Popup && window.Popup.confirm) {
      window.Popup.confirm(message, confirmReset);
    } else {
      if (confirm(message)) confirmReset();
    }
  });
}

document.addEventListener("fullscreenchange", () => {
  localStorage.setItem(
    "breakerFullscreenEnabled",
    document.fullscreenElement ? "true" : "false"
  );
  updateFullscreenLabel(getCurrentLang());
});
updateLanguageButtons(getCurrentLang());
updateFullscreenLabel(getCurrentLang());

document.addEventListener("languagechange", (e) => {
  const lang = e.detail?.lang || getCurrentLang();
  updateLanguageButtons(lang);
  updateFullscreenLabel(lang);
});

const profileBtn = document.getElementById("profileBtn");

profileBtn.onclick = () => {
  window.location.href = "../pages/profile.html";
};
