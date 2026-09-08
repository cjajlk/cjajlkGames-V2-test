/* ====================================
   🌍 I18N SYSTEM (FR/EN)
==================================== */

const APP_VERSION = "2026.02.14";
const VERSION_STORAGE_KEY = "breaker_app_version";

function ensureAppVersion() {
  try {
    const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
    if (storedVersion && storedVersion !== APP_VERSION) {
      localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
      window.location.reload();
      return;
    }

    if (!storedVersion) {
      localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
    }
  } catch (error) {
    console.warn("Version check skipped:", error);
  }
}

function showAppVersionBadge() {
  if (document.getElementById("appVersionBadge")) return;

  const badge = document.createElement("div");
  badge.id = "appVersionBadge";
  badge.textContent = `v${APP_VERSION}`;
  badge.style.position = "fixed";
  badge.style.left = "12px";
  badge.style.bottom = "10px";
  badge.style.padding = "4px 8px";
  badge.style.background = "rgba(0, 0, 0, 0.55)";
  badge.style.color = "#ffffff";
  badge.style.fontSize = "12px";
  badge.style.fontFamily = "Arial, sans-serif";
  badge.style.borderRadius = "6px";
  badge.style.zIndex = "999999";
  badge.style.pointerEvents = "none";

  document.body.appendChild(badge);
}

document.addEventListener("DOMContentLoaded", () => {
  ensureAppVersion();
  // Afficher le badge version uniquement sur le menu principal
  if (window.location.pathname.endsWith("mainmenu.html")) {
    showAppVersionBadge();
  }
});

const I18N_STRINGS = {
  fr: {
    common: {
      menu: "Menu",
      backToMenu: "Menu",
      ok: "OK",
      cancel: "Annuler",
      close: "Fermer",
      unlock: "Débloquer",
      purchase: "Acheter",
      owned: "Possédé",
      free: "GRATUIT",
      locked: "Verrouillé",
      levelShort: "Niv.",
      level: "Niveau",
      xp: "XP",
      bonus: "Bonus"
    },
    titles: {
      intro: "Breaker Nocturne",
      menu: "Breaker — Menu",
      mainmenu: "Breaker Nocturne",
      profile: "Profil — Breaker",
      ecurie: "Écurie — Breaker",
      collection: "Collection — Breaker",
      shop: "Boutique — Breaker",
      gameplay: "Breaker — Gameplay",
      campaign: "Campagne — Breaker"
    },
    campaign: {
      selectWorld: "Sélectionnez un monde",
      defeatBoss: "Vaincre le Gardien de la Cité pour débloquer"
    },
    menu: {
      enter: "ENTREZ"
    },
    intro: {
      clickToStart: "Cliquez pour commencer"
    },
    mainmenu: {
      play: "▶ JOUER",
      shop: "🛍 Boutique",
      stable: "🌿 Écurie",
      collection: "📚 Collection",
      tutorial: "📚 Tutoriel",
      eventSoon: "✨ Événement bientôt disponible"
    },
    options: {
      title: "Options",
      language: "Langue",
      fullscreen: "Mode plein écran",
      fullscreenOn: "Activer",
      fullscreenOff: "Quitter",
      resetProfile: "Réinitialiser le profil",
      resetButton: "Réinitialiser",
      resetWarn: "Vous perdrez toutes vos mascottes achetées.",
      resetConfirmTitle: "Réinitialiser le profil",
      fullscreenUnsupported: "Plein écran non supporté"
    },
    rights: {
      text: "Tous droits réservés — créé par CJajlk"
    },
    profile: {
      title: "👤 Profil",
      subtitle: "Tes statistiques et progression",
      pseudo: "Pseudo",
      clickToEdit: "✏️ Clique pour modifier",
      titlePrefix: "Titre :",
      titleLocked: "À débloquer",
      equippedCompanion: "Compagnon Équipé",
      change: "Changer",
      playTime: "Temps de Jeu",
      diamonds: "Diamants",
      collection: "Collection",
      stableBtn: "Écurie",
      pseudoPrompt: "Entre ton pseudo ✨",
      pseudoInvalid: "Pseudo invalide !",
      pseudoUpdated: "Pseudo modifié ! 🎉",
      popupMissing: "Système de popup non chargé",
      popupInputMissing: "Popup.input non disponible"
    },
    ecurie: {
      title: "🐾 Écurie",
      subtitle: "Vos compagnons fidèles",
      equip: "Équiper",
      feed: "Nourrir",
      skipFeed: "Passer l'animation",
      locked: "🔒 Verrouillé",
      bonus: "Bonus",
      max: "MAX",
      lockedToast: "🔒 Ce compagnon doit être acheté en boutique !",
      equipLockedToast: "🔒 Achetez d'abord ce compagnon en boutique !",
      feedNoOrbs: "💧 Pas assez d'orbes",
      levelUp: "🎉 {name} est maintenant Niv. {level} !",
      feedXp: "✨ {name} a reçu +10 XP !",
      maxLevel: "🏆 {name} est déjà au niveau MAX ({max}) !"
    },
    collection: {
      title: "📚 Collection",
      subtitle: "Tes compagnons débloqués",
      unlockedSuffix: "débloqués",
      modalBonusTitle: "✨ Bonus",
      bonusNote: "🔮 Ces bonus seront ajoutés dans une prochaine mise à jour",
      statusUnlocked: "✓ Débloqué",
      statusLocked: "🔒 Verrouillé"
    },
    shop: {
      title: "Boutique",
      backToMenu: "Menu",
      diamondsLabel: "Diamants",
      categoryCompanions: "Mascottes",
      ownedBadge: "✓ POSSÉDÉ",
      owned: "POSSÉDÉ",
      notEnough: "PAS ASSEZ 💎",
      purchase: "ACHETER",
      unlock: "DÉBLOQUER",
      free: "GRATUIT",
      ownedText: "✓ Vous possédez cette mascotte",
      priceText: "💎 {price} Diamants",
      unlockedSuccess: "✨ {name} débloqué avec succès !",
      cancel: "Annuler",
      close: "Fermer",
      rarity: {
        common: "COMMUN",
        rare: "RARE",
        epic: "ÉPIQUE"
      }
    },
    bonus: {
      aube: {
        name: "Essence du Vide",
        desc: "Augmente l'XP gagnée"
      },
      aqua: {
        name: "Courant Aquatique",
        desc: "Augmente la vitesse de la balle"
      },
      ignis: {
        name: "Rage du Brasier",
        desc: "Augmente les dégâts aux briques"
      },
      astral: {
        name: "Bénédiction Céleste",
        desc: "Augmente le taux de drop d'orbes"
      },
      flora: {
        name: "Croissance Naturelle",
        desc: "Augmente la taille du paddle"
      },
      format: {
        xp: "+{value}% XP",
        speed: "+{value}% Vitesse",
        damage: "+{value}% Dégâts",
        drop: "+{value}% Drop Orbes",
        paddle: "+{value}% Taille Paddle"
      }
    },
    gameplay: {
      menu: "← Menu",
      levelShort: "Niv.",
      levelUpTitle: "🎉 Niveau supérieur ! 🎉\n\nVous avez atteint le niveau {level} !",
      bossPhase2: "⚡ BOSS PHASE 2 ⚡",
      bossPhase3: "🔥 BOSS PHASE 3 - RAGE ! 🔥",
      bossDefeated: "🎉 BOSS VAINCU ! 🎉\n\nVous avez battu le Gardien de la Cité !\n+{xp} XP",
      astralPhase1: "🌀 L'Épreuve de l'Alignement 🌀",
      astralPhase2: "🌠 Inversion des Flux 🌠",
      astralPhase3: "💫 Cœur Cosmique 💫",
      astralDefeat: "✨ VICTOIRE COSMIQUE ! ✨\n\nVous avez libéré le Gardien Astral !\n+{xp} XP"
    },
    encouragements: {
      orb: ["Excellent ! ✨", "Bien joué ! 🌟", "Continue ! 💫", "Magnifique ! ⭐", "Super ! 🎆"],
      combo: ["Combo incroyable ! 🔥", "En feu ! 🔥", "Unstoppable ! ⚡", "Parfait ! 💥", "Incroyable ! 🌟"],
      stage: ["Stage complété ! 🎉", "Victoire ! 🏆", "Bravo champion ! 👑", "Fantastique ! 🌟", "Tu es le meilleur ! ⭐"],
      levelup: ["Level Up ! 🎊", "Tu progresses ! 📈", "Plus fort ! 💪", "Évolution ! ✨", "Nouvelle puissance ! ⚡"],
      milestone: ["Score incroyable ! 🎯", "Légende ! 👑", "Record battu ! 🏆", "Champion ! 🌟", "Impressionnant ! 💎"],
      boss: ["Victoire épique ! 🏆", "Boss vaincu ! 👑", "Héros ! ⚔️", "Triomphe ! 🎊", "Gloire éternelle ! ✨"]
    },
    tutorial: {
      title: "🎓 Tutoriel — Breaker",
      welcome: {
        title: "Bienvenue dans Breaker",
        text: "Salut! Je m'appelle Aube. Je vais te montrer comment jouer à ce jeu incroyable!"
      },
      controls: {
        title: "Les Contrôles",
        text: "Tu peux utiliser les flèches du clavier ou ta souris pour bouger la raquette. Essaie!",
        paddle: "Ta Raquette",
        paddleDesc: "Bouge-la avec les flèches ou la souris"
      },
      ball: {
        title: "La Balle",
        text: "La balle rebondit sur ta raquette et casse les briques. Ne la laisse pas tomber!",
        ball: "La Balle",
        ballDesc: "Accélère avec chaque rebond"
      },
      bricks: {
        title: "Casse les Briques",
        text: "Chaque brique cassée te donne des points. Casse-les toutes pour passer au niveau suivant!",
        bricks: "Les Briques",
        bricksDesc: "Les vertes donnent peu de points, les rouges plus!"
      },
      powerups: {
        title: "Les Bonus",
        text: "Parfois, des bonus tombent des briques. Attrape-les pour des effets spéciaux!",
        power: "Bonus",
        powerDesc: "Ralentir, Agrandir, Attaquer!"
      },
      companions: {
        title: "Les Compagnons",
        text: "Utilise tes compagnons pour obtenir des bonus. Chacun a des pouvoirs uniques!",
        comp: "Compagnon",
        compDesc: "XP bonus, vitesse, dégâts..."
      },
      boss: {
        title: "Le Boss",
        text: "À la fin de chaque monde, tu affronteras un boss. Sois prudent, il est puissant!",
        boss: "Boss",
        bossDesc: "Barre de vie, attaques spéciales"
      },
      ready: {
        title: "Es-tu Prêt?",
        text: "Maintenant, commençons à jouer! Bonne chance, futur champion!"
      },
      prev: "← Précédent",
      next: "Suivant →",
      finish: "Commencer!",
      skip: "Sauter",
      confirmSkip: "Sauter le tutoriel?",
      completed: "Tutoriel complété!"
    }
  },
  en: {
    common: {
      menu: "Menu",
      backToMenu: "Menu",
      ok: "OK",
      cancel: "Cancel",
      close: "Close",
      unlock: "Unlock",
      purchase: "Purchase",
      owned: "Owned",
      free: "FREE",
      locked: "Locked",
      levelShort: "Lvl.",
      level: "Level",
      xp: "XP",
      bonus: "Bonus"
    },
    titles: {
      intro: "Breaker Nocturne",
      menu: "Breaker — Menu",
      mainmenu: "Breaker Nocturne",
      profile: "Profile — Breaker",
      ecurie: "Stable — Breaker",
      collection: "Collection — Breaker",
      shop: "Shop — Breaker",
      gameplay: "Breaker — Gameplay",
      campaign: "Campaign — Breaker"
    },
    campaign: {
      selectWorld: "Select a world",
      defeatBoss: "Defeat the City Guardian to unlock"
    },
    menu: {
      enter: "ENTER"
    },
    intro: {
      clickToStart: "Click to start"
    },
    mainmenu: {
      play: "▶ PLAY",
      shop: "🛍 Shop",
      stable: "🌿 Stable",
      collection: "📚 Collection",
      tutorial: "📚 Tutorial",
      eventSoon: "✨ Event coming soon"
    },
    options: {
      title: "Options",
      language: "Language",
      fullscreen: "Fullscreen",
      fullscreenOn: "Enable",
      fullscreenOff: "Exit",
      resetProfile: "Reset profile",
      resetButton: "Reset",
      resetWarn: "You will lose all purchased companions.",
      resetConfirmTitle: "Reset profile",
      fullscreenUnsupported: "Fullscreen not supported"
    },
    rights: {
      text: "All rights reserved — created by CJajlk"
    },
    profile: {
      title: "👤 Profile",
      subtitle: "Your stats and progression",
      pseudo: "Nickname",
      clickToEdit: "✏️ Click to edit",
      titlePrefix: "Title:",
      titleLocked: "Locked",
      equippedCompanion: "Equipped Companion",
      change: "Change",
      playTime: "Play Time",
      diamonds: "Diamonds",
      collection: "Collection",
      stableBtn: "Stable",
      pseudoPrompt: "Enter your nickname ✨",
      pseudoInvalid: "Invalid nickname!",
      pseudoUpdated: "Nickname updated! 🎉",
      popupMissing: "Popup system not loaded",
      popupInputMissing: "Popup.input not available"
    },
    ecurie: {
      title: "🐾 Stable",
      subtitle: "Your loyal companions",
      equip: "Equip",
      feed: "Feed",
      skipFeed: "Skip animation",
      locked: "🔒 Locked",
      bonus: "Bonus",
      max: "MAX",
      lockedToast: "🔒 This companion must be purchased in the shop!",
      equipLockedToast: "🔒 Buy this companion in the shop first!",
      feedNoOrbs: "💧 Not enough orbs",
      levelUp: "🎉 {name} is now Lvl. {level}!",
      feedXp: "✨ {name} gained +10 XP!",
      maxLevel: "🏆 {name} is already MAX level ({max})!"
    },
    collection: {
      title: "📚 Collection",
      subtitle: "Your unlocked companions",
      unlockedSuffix: "unlocked",
      modalBonusTitle: "✨ Bonus",
      bonusNote: "🔮 These bonuses will be added in a future update",
      statusUnlocked: "✓ Unlocked",
      statusLocked: "🔒 Locked"
    },
    shop: {
      title: "Shop",
      backToMenu: "Menu",
      diamondsLabel: "Diamonds",
      categoryCompanions: "Companions",
      ownedBadge: "✓ OWNED",
      owned: "OWNED",
      notEnough: "NOT ENOUGH 💎",
      purchase: "PURCHASE",
      unlock: "UNLOCK",
      free: "FREE",
      ownedText: "✓ You own this companion",
      priceText: "💎 {price} Diamonds",
      unlockedSuccess: "✨ {name} unlocked successfully!",
      cancel: "Cancel",
      close: "Close",
      rarity: {
        common: "COMMON",
        rare: "RARE",
        epic: "EPIC"
      }
    },
    bonus: {
      aube: {
        name: "Void Essence",
        desc: "Increases XP gained"
      },
      aqua: {
        name: "Aqua Current",
        desc: "Increases ball speed"
      },
      ignis: {
        name: "Blazing Rage",
        desc: "Increases brick damage"
      },
      astral: {
        name: "Celestial Blessing",
        desc: "Increases orb drop rate"
      },
      flora: {
        name: "Natural Growth",
        desc: "Increases paddle size"
      },
      format: {
        xp: "+{value}% XP",
        speed: "+{value}% Speed",
        damage: "+{value}% Damage",
        drop: "+{value}% Orb Drop",
        paddle: "+{value}% Paddle Size"
      }
    },
    gameplay: {
      menu: "← Menu",
      levelShort: "Lvl.",
      levelUpTitle: "🎉 Level Up! 🎉\n\nYou reached Level {level}!",
      bossPhase2: "⚡ BOSS PHASE 2 ⚡",
      bossPhase3: "🔥 BOSS PHASE 3 - RAGE! 🔥",
      bossDefeated: "🎉 BOSS DEFEATED! 🎉\n\nYou defeated the City Guardian!\n+{xp} XP",
      astralPhase1: "🌀 The Trial of Alignment 🌀",
      astralPhase2: "🌠 Inversion of Flows 🌠",
      astralPhase3: "💫 Cosmic Heart 💫",
      astralDefeat: "✨ COSMIC VICTORY! ✨\n\nYou freed the Astral Guardian!\n+{xp} XP"
    },
    encouragements: {
      orb: ["Excellent! ✨", "Well done! 🌟", "Keep going! 💫", "Magnificent! ⭐", "Great! 🎆"],
      combo: ["Amazing combo! 🔥", "On fire! 🔥", "Unstoppable! ⚡", "Perfect! 💥", "Incredible! 🌟"],
      stage: ["Stage cleared! 🎉", "Victory! 🏆", "Well played! 👑", "Fantastic! 🌟", "You are the best! ⭐"],
      levelup: ["Level Up! 🎊", "You are improving! 📈", "Stronger! 💪", "Evolution! ✨", "New power! ⚡"],
      milestone: ["Amazing score! 🎯", "Legend! 👑", "Record broken! 🏆", "Champion! 🌟", "Impressive! 💎"],
      boss: ["Epic victory! 🏆", "Boss defeated! 👑", "Hero! ⚔️", "Triumph! 🎊", "Eternal glory! ✨"]
    },
    tutorial: {
      title: "🎓 Tutorial — Breaker",
      welcome: {
        title: "Welcome to Breaker",
        text: "Hi! My name is Aube. I'll show you how to play this amazing game!"
      },
      controls: {
        title: "The Controls",
        text: "You can use arrow keys or your mouse to move the paddle. Try it!",
        paddle: "Your Paddle",
        paddleDesc: "Move it with arrows or mouse"
      },
      ball: {
        title: "The Ball",
        text: "The ball bounces on your paddle and breaks bricks. Don't let it fall!",
        ball: "The Ball",
        ballDesc: "Speeds up with each bounce"
      },
      bricks: {
        title: "Break the Bricks",
        text: "Each broken brick gives you points. Break them all to advance to the next level!",
        bricks: "The Bricks",
        bricksDesc: "Green ones give few points, red ones give more!"
      },
      powerups: {
        title: "The Powerups",
        text: "Sometimes powerups fall from bricks. Catch them for special effects!",
        power: "Powerup",
        powerDesc: "Slow down, Enlarge, Attack!"
      },
      companions: {
        title: "The Companions",
        text: "Use your companions to get bonuses. Each one has unique powers!",
        comp: "Companion",
        compDesc: "Bonus XP, speed, damage..."
      },
      boss: {
        title: "The Boss",
        text: "At the end of each world, you'll face a boss. Be careful, it's powerful!",
        boss: "Boss",
        bossDesc: "Health bar, special attacks"
      },
      ready: {
        title: "Are You Ready?",
        text: "Now let's start playing! Good luck, future champion!"
      },
      prev: "← Previous",
      next: "Next →",
      finish: "Start!",
      skip: "Skip",
      confirmSkip: "Skip the tutorial?",
      completed: "Tutorial completed!"
    }
  }
};

const LANG_KEY = "breaker_lang";
let currentLang = localStorage.getItem(LANG_KEY) || "fr";

function resolveKey(path, obj) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function formatParams(text, params) {
  if (!params) return text;
  return Object.keys(params).reduce((acc, key) => {
    return acc.replace(new RegExp(`\\{${key}\\}`, "g"), params[key]);
  }, text);
}

function t(key, params) {
  const langPack = I18N_STRINGS[currentLang] || I18N_STRINGS.fr;
  const value = resolveKey(key, langPack);
  if (value === undefined) return key;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return formatParams(value, params);
  return value;
}

function applyTranslations(root = document) {
  const langPack = I18N_STRINGS[currentLang] || I18N_STRINGS.fr;

  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const value = resolveKey(key, langPack);
    if (typeof value === "string") {
      el.textContent = value;
    }
  });

  root.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    const value = resolveKey(key, langPack);
    if (typeof value === "string") {
      el.innerHTML = value;
    }
  });

  root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    const pairs = el.getAttribute("data-i18n-attr").split(";");
    pairs.forEach((pair) => {
      const [attr, key] = pair.split(":");
      if (!attr || !key) return;
      const value = resolveKey(key.trim(), langPack);
      if (typeof value === "string") {
        el.setAttribute(attr.trim(), value);
      }
    });
  });

  document.documentElement.setAttribute("lang", currentLang);
}

function setLanguage(lang) {
  if (!I18N_STRINGS[lang]) lang = "fr";
  currentLang = lang;
  localStorage.setItem(LANG_KEY, currentLang);
  applyTranslations();
  document.dispatchEvent(new CustomEvent("languagechange", { detail: { lang: currentLang } }));
}

function getLanguage() {
  return currentLang;
}

document.addEventListener("DOMContentLoaded", () => {
  applyTranslations();
});

window.I18n = {
  t,
  setLanguage,
  getLanguage,
  applyTranslations
};

// Fonction globale i18nT disponible dans tous les scripts
const i18nT = (key, params) => (window.I18n ? window.I18n.t(key, params) : key);

// Gestion UI tutoriel Breaker premium
const tutorialSteps = [
  "welcome",
  "controls",
  "ball",
  "bricks",
  "powerups",
  "companions",
  "boss",
  "ready"
];
let currentStep = 0;

function updateTutorialUI() {
  const title = document.getElementById("tutorialTitle");
  const speech = document.getElementById("speechText");
  if (!title || !speech) return;
  const stepKey = tutorialSteps[currentStep];
  title.textContent = i18nT(`tutorial.${stepKey}.title`);
  speech.textContent = i18nT(`tutorial.${stepKey}.text`);

  // Animation douce
  document.querySelectorAll('.tutorial-step').forEach(el => el.classList.remove('is-active'));
  document.querySelectorAll('.tutorial-step')[0].classList.add('is-active');

  // Dots
  const dots = document.querySelectorAll('.dot');
  dots.forEach((dot, i) => dot.classList.toggle('active', i === currentStep));

  // Boutons
  document.getElementById("prevBtn").disabled = currentStep === 0;
  document.getElementById("nextBtn").disabled = currentStep === tutorialSteps.length - 1;
}

function nextTutorialStep() {
  if (currentStep < tutorialSteps.length - 1) {
    currentStep++;
    updateTutorialUI();
  }
}
function prevTutorialStep() {
  if (currentStep > 0) {
    currentStep--;
    updateTutorialUI();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  if (prevBtn) prevBtn.addEventListener("click", prevTutorialStep);
  if (nextBtn) nextBtn.addEventListener("click", nextTutorialStep);
  updateTutorialUI();
});
