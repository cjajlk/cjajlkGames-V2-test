(function () {
    "use strict";

    function openOptions() {
        const overlay = document.getElementById("optionsOverlay");
        if (!overlay) return;
        overlay.classList.remove("hidden");
        setTimeout(() => overlay.classList.add("visible"), 10);
        if (typeof window.syncHudVisibility === "function") window.syncHudVisibility();
        updateFullscreenLabel();
        syncLanguageSelect();
        if (typeof window.applyTranslations === "function") {
            window.applyTranslations();
        }
    }

    function closeOptions() {
        const overlay = document.getElementById("optionsOverlay");
        if (!overlay) return;
        overlay.classList.remove("visible");
        setTimeout(() => overlay.classList.add("hidden"), 300);
        if (typeof window.syncHudVisibility === "function") window.syncHudVisibility();
        setTimeout(() => {
            if (typeof window.syncHudVisibility === "function") window.syncHudVisibility();
        }, 320);
    }

    function updateFullscreenLabel() {
        const btn = document.getElementById("fullscreenToggle");
        if (!btn) return;
        if (typeof window.t === "function") {
            btn.textContent = document.fullscreenElement
                ? window.t("TEXT_FULLSCREEN_OFF")
                : window.t("TEXT_FULLSCREEN_ON");
        } else {
            btn.textContent = document.fullscreenElement ? "Desactiver" : "Activer";
        }
    }

    function getResetKeyword() {
        const lang = window.currentLanguage || "fr";
        return lang === "en" ? "DELETE" : "SUPPRIMER";
    }

    function toggleFullscreen() {
        const root = document.documentElement;
        if (!root || !root.requestFullscreen || !document.exitFullscreen) return;

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
            localStorage.setItem("attrapeFullscreenEnabled", "false");
        } else {
            root.requestFullscreen().catch(() => {});
            localStorage.setItem("attrapeFullscreenEnabled", "true");
        }
    }

    function restoreFullscreen() {
        const enabled = localStorage.getItem("attrapeFullscreenEnabled") === "true";
        if (!enabled) return;
        
        const root = document.documentElement;
        if (!root || !root.requestFullscreen || document.fullscreenElement) return;
        
        root.requestFullscreen().catch(() => {});
    }

    function handleFullscreenChange() {
        updateFullscreenLabel();
        localStorage.setItem(
            "attrapeFullscreenEnabled",
            document.fullscreenElement ? "true" : "false"
        );
    }

    function setLanguage(lang) {
        if (!lang) return;
        if (typeof window.setCurrentLanguage === "function") {
            window.setCurrentLanguage(lang);
        } else {
            window.currentLanguage = lang;
        }

        if (typeof window.applyTranslations === "function") {
            window.applyTranslations();
        }
        if (typeof window.savePlayerProfile === "function") {
            window.savePlayerProfile();
        }
    }

    function syncLanguageSelect() {
        const select = document.getElementById("languageSelect");
        if (!select) return;
        const lang = window.currentLanguage || "fr";
        select.value = lang;
    }

    function openResetConfirm() {
        const overlay = document.getElementById("resetConfirmOverlay");
        const input = document.getElementById("resetConfirmInput");
        const confirmBtn = document.getElementById("resetConfirmBtn");
        if (!overlay || !input || !confirmBtn) return;

        input.value = "";
        confirmBtn.disabled = true;
        overlay.classList.remove("hidden");
        setTimeout(() => overlay.classList.add("visible"), 10);
        input.focus();
    }

    function closeResetConfirm() {
        const overlay = document.getElementById("resetConfirmOverlay");
        if (!overlay) return;
        overlay.classList.remove("visible");
        setTimeout(() => overlay.classList.add("hidden"), 300);
    }

    function initResetConfirm() {
        const overlay = document.getElementById("resetConfirmOverlay");
        const input = document.getElementById("resetConfirmInput");
        const confirmBtn = document.getElementById("resetConfirmBtn");
        const cancelBtn = document.getElementById("resetCancelBtn");

        if (!overlay || !input || !confirmBtn || !cancelBtn) return;

        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) closeResetConfirm();
        });

        input.addEventListener("input", () => {
            const expected = getResetKeyword();
            const ok = input.value.trim().toUpperCase() === expected;
            confirmBtn.disabled = !ok;
        });

        cancelBtn.addEventListener("click", closeResetConfirm);
        confirmBtn.addEventListener("click", () => {
            const expected = getResetKeyword();
            if (input.value.trim().toUpperCase() !== expected) return;
            if (typeof window.resetPlayerProfile === "function") {
                window.resetPlayerProfile();
            }
            closeResetConfirm();
        });
    }

    function initOptions() {
        const fullscreenBtn = document.getElementById("fullscreenToggle");
        const languageSelect = document.getElementById("languageSelect");
        const resetBtn = document.getElementById("resetProfileBtn");

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener("click", () => {
                toggleFullscreen();
                setTimeout(updateFullscreenLabel, 50);
            });
        }

        if (languageSelect) {
            languageSelect.addEventListener("change", (event) => {
                setLanguage(event.target.value);
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener("click", openResetConfirm);
        }

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        initResetConfirm();
    }

    document.addEventListener("DOMContentLoaded", initOptions);

    window.openOptions = openOptions;
    window.closeOptions = closeOptions;
    window.restoreFullscreen = restoreFullscreen;
})();
