(function () {
    "use strict";

    const STRINGS = {
        fr: {
            TEXT_GAME_MODES: "Mode de jeu",
            TEXT_SHOP: "Boutique",
            TEXT_PROFILE: "Profil Joueur",
            TEXT_OPTIONS: "Options",
            TEXT_SUPPORT: "aide le createur",
            TEXT_FULLSCREEN: "Plein ecran",
            TEXT_FULLSCREEN_ON: "Activer",
            TEXT_FULLSCREEN_OFF: "Desactiver",
            TEXT_LANGUAGE: "Langue",
            TEXT_RESET_PROFILE: "Reinitialiser mon profil",
            TEXT_RESET: "Reinitialiser",
            TEXT_RESET_TITLE: "Reinitialisation du profil",
            TEXT_RESET_WARNING: "⚠️ Cette action supprimera definitivement vos gemmes, CJ, mascottes debloquees et packs achetes.",
            TEXT_RESET_TYPE: "Tapez SUPPRIMER pour confirmer.",
            TEXT_CANCEL: "Annuler",
            TEXT_CONFIRM: "Confirmer"
        },
        en: {
            TEXT_GAME_MODES: "Game Modes",
            TEXT_SHOP: "Shop",
            TEXT_PROFILE: "Player Profile",
            TEXT_OPTIONS: "Options",
            TEXT_SUPPORT: "support the creator",
            TEXT_FULLSCREEN: "Fullscreen",
            TEXT_FULLSCREEN_ON: "Enable",
            TEXT_FULLSCREEN_OFF: "Disable",
            TEXT_LANGUAGE: "Language",
            TEXT_RESET_PROFILE: "Reset my profile",
            TEXT_RESET: "Reset",
            TEXT_RESET_TITLE: "Profile reset",
            TEXT_RESET_WARNING: "⚠️ This will permanently remove your gems, CJ, unlocked mascots, and purchased packs.",
            TEXT_RESET_TYPE: "Type DELETE to confirm.",
            TEXT_CANCEL: "Cancel",
            TEXT_CONFIRM: "Confirm"
        }
    };

    function t(key) {
        const lang = window.currentLanguage || "fr";
        return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.fr[key] || key;
    }

    function applyTranslations() {
        const nodes = document.querySelectorAll("[data-i18n]");
        nodes.forEach(node => {
            const key = node.getAttribute("data-i18n");
            if (!key) return;
            node.textContent = t(key);
        });

        const fullscreenToggle = document.getElementById("fullscreenToggle");
        if (fullscreenToggle) {
            fullscreenToggle.textContent = document.fullscreenElement
                ? t("TEXT_FULLSCREEN_OFF")
                : t("TEXT_FULLSCREEN_ON");
        }
    }

    window.Translations = STRINGS;
    window.t = t;
    window.applyTranslations = applyTranslations;
})();
