/* ====================================
   PROFILE PAGE - AAA JAVASCRIPT
   Modern UI with Toast Notifications
==================================== */

console.log("PROFILE.JS CHARGÉ ✅", Date.now());

// ====================================
// TOAST NOTIFICATION SYSTEM
// ====================================
const Toast = {
    show: function(message, type = 'success') {
        if (window.Popup && window.Popup.notify) {
            window.Popup.notify(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
};

// ====================================
// PLAYER PROFILE DATA SYSTEM
// Source unique dans localStorage
// ====================================

const PROFILE_KEY = "breaker_profile";

const defaultProfile = {
  pseudo: "CJ",
  titre: "À débloquer",
  mascotte: "aube",

  xp: 0,
  temps: 0,
  diamants: 0,
  collection: 0,

  orbs: {
    water: 0,
    fire: 0,
    light: 0,
    nature: 0,
    void: 0,
    mystique: 0 // Ajout pour Dragon Mystique
  },

  equippedCompanion: "aube",
  unlockedCompanions: ["aube"],
  companions: {
    aube:   { level: 1, xp: 0 },
    aqua:   { level: 1, xp: 0 },
    astral: { level: 1, xp: 0 },
    flora:  { level: 1, xp: 0 },
    ignis:  { level: 1, xp: 0 }
  }
};

// ====================================
// LOAD & SAVE FUNCTIONS
// ====================================

function loadProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  
  console.log("📂 Loading profile from localStorage...");
  console.log("📄 Raw data:", raw);

  if (!raw || raw === "undefined") {
    console.log("⚠️ No profile found, will use default");
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    
    // ✅ VÉRIFICATION DE LA VALIDITÉ DES COMPAGNONS DÉBLOQUÉS
    if (parsed.unlockedCompanions) {
      console.log("🔍 Vérification des compagnons débloqués:", parsed.unlockedCompanions);
      
      // Liste des compagnons valides
      const validCompanions = ["aube", "aqua", "ignis", "astral", "flora", "dragonMystique"];
      
      // Filtrer les compagnons invalides
      parsed.unlockedCompanions = parsed.unlockedCompanions.filter(id => validCompanions.includes(id));
      
      // S'assurer qu'au moins Aube est présent
      if (!parsed.unlockedCompanions.includes("aube")) {
        parsed.unlockedCompanions.unshift("aube");
      }
      
      console.log("✅ Compagnons débloqués après vérification:", parsed.unlockedCompanions);
    } else {
      // Si pas de unlockedCompanions, créer avec Aube seulement
      parsed.unlockedCompanions = ["aube"];
      console.log("⚠️ unlockedCompanions manquant, ajout d'Aube par défaut");
    }
    
    console.log("✅ Profile loaded successfully:", parsed);
    return parsed;
  } catch (e) {
    console.warn("❌ Profil corrompu, reset.", e);
    return null;
  }
}

function saveProfile(profile) {
  console.log("💾 Saving profile to localStorage:", profile);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  
  // Vérification complète
  const saved = localStorage.getItem(PROFILE_KEY);
  console.log("✅ Profile saved. Verification:", saved ? "OK" : "FAILED");
  
  if (saved) {
    const parsed = JSON.parse(saved);
    console.log("📦 Saved data verified:");
    console.log("  - Pseudo:", parsed.pseudo);
    console.log("  - Equipped Companion:", parsed.equippedCompanion);
    console.log("  - Unlocked Companions:", parsed.unlockedCompanions);
    console.log("  - Diamants:", parsed.diamants);
    console.log("  - Orbs:", parsed.orbs);
    console.log("  - Companions data:", parsed.companions);
  }
}

function normalizeProfile(p) {
  if (!p) p = { ...defaultProfile };

  if (!p.orbs) p.orbs = { water: 0, fire: 0, light: 0, nature: 0, void: 0, mystique: 0 };
  // Ajout du champ mystique si absent
  if (p.orbs.mystique === undefined) p.orbs.mystique = 0;
  if (!p.companions) p.companions = {};
  const legacyCompanionMap = {
    blue: "aqua",
    fire: "ignis",
    light: "astral",
    nature: "flora"
  };

  Object.keys(legacyCompanionMap).forEach((oldId) => {
    const newId = legacyCompanionMap[oldId];
    if (p.companions[oldId] && !p.companions[newId]) {
      p.companions[newId] = p.companions[oldId];
    }
    if (p.companions[oldId]) delete p.companions[oldId];
  });

  ["aube", "aqua", "astral", "flora", "ignis"].forEach((id) => {
    if (!p.companions[id]) p.companions[id] = { level: 1, xp: 0 };
    if (typeof p.companions[id].level !== "number") p.companions[id].level = 1;
    if (typeof p.companions[id].xp !== "number") p.companions[id].xp = 0;
  });

  if (!p.equippedCompanion) p.equippedCompanion = "aube";
  
  // ✅ VÉRIFICATION STRICTE DES COMPAGNONS DÉBLOQUÉS
  if (!p.unlockedCompanions || !Array.isArray(p.unlockedCompanions)) {
    console.warn("⚠️ unlockedCompanions invalide, réinitialisation à ['aube']");
    p.unlockedCompanions = ["aube"];
  } else {
    const legacyMap = {
      blue: "aqua",
      fire: "ignis",
      light: "astral",
      nature: "flora"
    };

    // Migrer les anciens IDs
    p.unlockedCompanions = p.unlockedCompanions.map((id) => legacyMap[id] || id);

    // Filtrer uniquement les IDs valides
    const validIds = ["aube", "aqua", "ignis", "astral", "flora", "dragonMystique"];
    const before = p.unlockedCompanions.length;
    p.unlockedCompanions = p.unlockedCompanions.filter(id => validIds.includes(id));

    // Supprimer doublons
    p.unlockedCompanions = Array.from(new Set(p.unlockedCompanions));
    
    // S'assurer qu'Aube est toujours présent
    if (!p.unlockedCompanions.includes("aube")) {
      p.unlockedCompanions.unshift("aube");
    }
    
    // Log si correction effectuée
    if (before !== p.unlockedCompanions.length) {
      console.warn(`⚠️ Correction: ${before} → ${p.unlockedCompanions.length} compagnons débloqués`);
      console.log("✅ Compagnons valides:", p.unlockedCompanions);
    }
  }
  
  return p;
}

// ====================================
// PUBLIC API (used by gameplay, shop, ecurie)
// ====================================

let profileCorrected = false;

function getPlayerProfile() {
  const loaded = loadProfile();
  const normalized = normalizeProfile(loaded);
  
  // Si le profil a été corrigé, sauvegarder automatiquement
  if (loaded && JSON.stringify(loaded.unlockedCompanions) !== JSON.stringify(normalized.unlockedCompanions)) {
    console.log("🔧 Auto-correction du profil détectée, sauvegarde...");
    saveProfile(normalized);
    profileCorrected = true;
  }
  
  return normalized;
}

function savePlayerProfile(p) {
  saveProfile(normalizeProfile(p));
}

// ---- ORBS MANAGEMENT ----
function getOrbs() {
  return getPlayerProfile().orbs;
}

function getOrbCount(type) {
  const o = getOrbs();
  if (type) return Number(o[type] || 0);
  // Ajout du total mystique
  return Number(o.water || 0) + Number(o.fire || 0) + Number(o.light || 0) + Number(o.nature || 0) + Number(o.void || 0) + Number(o.mystique || 0);
}

function addOrb(type, amount = 1) {
  const p = getPlayerProfile();
  if (p.orbs[type] === undefined) p.orbs[type] = 0;
  
  console.log("💧 Adding orb:", type, "x", amount, "- Before:", p.orbs[type]);
  p.orbs[type] += amount;
  savePlayerProfile(p);
  
  // Vérification
  const verified = getPlayerProfile();
  console.log("✅ After add - Orb", type, ":", verified.orbs[type]);
  
  updateOrbHUD();
}

function consumeOrb(type, amount = 1) {
    const p = getPlayerProfile();
    if (!p.orbs) p.orbs = {};
    if (p.orbs[type] === undefined) p.orbs[type] = 0;

    if (p.orbs[type] < amount) {
      console.log("❌ Cannot consume orb:", type, "- Need:", amount, "Have:", p.orbs[type] || 0);
      return false;
    }

    console.log("💧 Consuming orb:", type, "x", amount, "- Before:", p.orbs[type]);
    p.orbs[type] -= amount;
    savePlayerProfile(p);
    
    // Vérification
    const verified = getPlayerProfile();
    console.log("✅ After consume - Orb", type, ":", verified.orbs[type]);
    
    return true;
}

function updateOrbHUD() {
    const orbs = getPlayerProfile().orbs;

    const aqua   = document.getElementById("orbAqua");
    const ignis  = document.getElementById("orbIgnis");
    const astral = document.getElementById("orbAstral");
    const flora  = document.getElementById("orbFlora");
    const voidOrb= document.getElementById("orbVoid");
    const mystique = document.getElementById("orbMystique");

    if (aqua)   aqua.textContent   = "x" + (orbs.water  || 0);
    if (ignis)  ignis.textContent  = "x" + (orbs.fire   || 0);
    if (astral) astral.textContent = "x" + (orbs.light  || 0);
    if (flora)  flora.textContent  = "x" + (orbs.nature || 0);
    if (voidOrb)voidOrb.textContent= "x" + (orbs.void   || 0);
    // Ajout pour Dragon Mystique si un orbe spécial existe
    if (mystique && orbs.mystique !== undefined) mystique.textContent = "x" + (orbs.mystique || 0);
}

// ====================================
// COMPANION NAME MAPPING
// ====================================

const COMPANION_NAMES = {
    aube: "Aube",
    aqua: "Aqua",
    flora: "Flora",
    astral: "Astral",
    ignis: "Ignis"
};

const COMPANION_ELEMENTS = {
    aube: "Lumière",
    aqua: "Eau",
    flora: "Nature",
    astral: "Lumière",
    ignis: "Feu"
};

// ====================================
// TIME FORMATTING
// ====================================

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

// ====================================
// UI RENDERING
// ====================================

function renderProfile(profile) {
    if (!profile) {
        console.error("❌ Cannot render: profile is null/undefined");
        return;
    }

    console.log("🎨 Rendering profile:", profile);

    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
        } else {
            // Silent fail - element doesn't exist on this page
        }
    };

    // Identity Card
    set("playerPseudo", profile.pseudo);
    const defaultTitle = defaultProfile.titre;
    const lockedTitle = i18nT("profile.titleLocked");
    const titleValue = !profile.titre || profile.titre === defaultTitle ? lockedTitle : profile.titre;
    set("playerTitle", `${i18nT("profile.titlePrefix")} ${titleValue}`);
    
    // Level & XP
    const xp = Number(localStorage.getItem("breakerXP")) || 0;
    const level = Math.floor(xp / 1000) + 1;
    const progressPercent = (xp % 1000) / 10;
    console.log("[PROFILE XP]", xp, "level", level);

    set("playerLevel", level);
    set("progressText", `${xp % 1000} / 1000`);

    const progressBar = document.getElementById("progressBar");
    if (progressBar) {
        progressBar.style.width = progressPercent + "%";
        console.log(`📊 Progress bar set to ${progressPercent}%`);
    }

    // Companion Card
    const companionId = profile.equippedCompanion || "aube";
    const companionName = COMPANION_NAMES[companionId] || companionId;
    const companionElement = COMPANION_ELEMENTS[companionId] || "";

    set("companionName", companionName);
    set("companionElement", companionElement);

    const companionImg = document.getElementById("companionImage");
    if (companionImg) {
        // Chemin spécial pour astral (typo dans le nom du fichier assets)
        let imgPath;
        if (companionId === "astral") {
            imgPath = `../shop/categories/companions/light/astral_idle.png`;
        } else {
            imgPath = `../assets/companions/${companionId}/${companionId}_idle.png`;
        }
        companionImg.src = imgPath;
        companionImg.alt = companionName;
        console.log(`🖼️ Companion image set to: ${companionId}`);
    }

    // Stats Grid
    const totalCompanions = 5; // aube, aqua, ignis, astral, flora
    const unlockedCount = profile.unlockedCompanions ? profile.unlockedCompanions.length : 1;
    const collectionPercent = Math.floor((unlockedCount / totalCompanions) * 100);
    
    set("statTime", formatTime(profile.temps));
    set("statDiamonds", profile.diamants);
    // Synchronise aussi tous les éléments .diamonds-count (pour compatibilité UI)
    const diamondEls = document.querySelectorAll('.diamonds-count');
    diamondEls.forEach(el => {
      el.textContent = profile.diamants;
    });
    set("statCollection", collectionPercent + "%");
    
    // CJ Universels - Source unique: CJajlkAccount.getTotal()
    const totalCJ = (window.CJajlkAccount && window.CJajlkAccount.getTotal) ? window.CJajlkAccount.getTotal() : 0;
    set("statCJ", totalCJ);
    
    console.log("✅ Profile rendering complete");
}

// ====================================
// PSEUDO EDITING
// ====================================

function setupPseudoEdit() {
    const pseudoValue = document.getElementById("playerPseudo");
    
    if (!pseudoValue) {
        console.log("ℹ️ playerPseudo not found (not on profile page)");
        return;
    }
    
    // Remove any existing click handler to avoid duplicates
    const newElement = pseudoValue.cloneNode(true);
    pseudoValue.parentNode.replaceChild(newElement, pseudoValue);
    
    console.log("✅ Setting up pseudo edit click handler");
    
    newElement.style.cursor = "pointer";
    
    newElement.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log("🖱️ Pseudo clicked!", e);
        
        if (!window.Popup) {
            console.error("❌ window.Popup not found!");
          alert(i18nT("profile.popupMissing"));
            return;
        }
        
        if (!window.Popup.input) {
            console.error("❌ window.Popup.input not found!");
          alert(i18nT("profile.popupInputMissing"));
            return;
        }
        
        console.log("✅ Opening popup with value:", newElement.textContent);
        
        Popup.input(i18nT("profile.pseudoPrompt"), newElement.textContent, (name) => {
            console.log("📝 New name received:", name);
            
            const clean = name.trim().slice(0, 12);
            
            if (!clean) {
                if (Toast && Toast.show) {
                    Toast.show(i18nT("profile.pseudoInvalid"), "error");
                }
                return;
            }

            const profile = getPlayerProfile();
            profile.pseudo = clean;
            savePlayerProfile(profile);
            
            newElement.textContent = clean;
            
            if (Toast && Toast.show) {
                Toast.show(i18nT("profile.pseudoUpdated"), "success");
            }
            
            console.log("✅ Pseudo updated to:", clean);
        });
    };
    
    console.log("✅ Pseudo edit setup complete");
}

// ====================================
// NAVIGATION SETUP
// ====================================

function setupNavigation() {
    // Bouton Écurie
    const btnEcurie = document.getElementById("btnEcurie");
    if (btnEcurie) {
        btnEcurie.onclick = () => {
            window.location.href = "../pages/ecurie.html";
        };
    }

    // Bouton Boutique
    const btnBoutique = document.getElementById("btnBoutique");
    if (btnBoutique) {
        btnBoutique.onclick = () => {
            window.location.href = "../pages/shop.html";
        };
    }

    // Bouton Changer Compagnon
    const btnChangeCompanion = document.getElementById("btnChangeCompanion");
    if (btnChangeCompanion) {
        btnChangeCompanion.onclick = () => {
            window.location.href = "../pages/ecurie.html";
        };
    }

    // Back button (if exists)
    const backBtn = document.getElementById("goBack");
    if (backBtn) {
        backBtn.onclick = () => {
            window.location.href = "../pages/mainmenu.html";
        };
    }
}

// ====================================
// LEGACY API for other files
// ====================================

function addXP(amount) {
    const profile = getPlayerProfile();
    profile.xp += amount;
    savePlayerProfile(profile);
    renderProfile(profile);
}

function addDiamants(amount) {
    const profile = getPlayerProfile();
    profile.diamants += amount;
    savePlayerProfile(profile);
    renderProfile(profile);
    // Déclenche un événement custom pour synchroniser l’UI partout
    if (typeof window !== 'undefined') {
      const evt = new CustomEvent('diamondsChanged', { detail: { value: profile.diamants } });
      window.dispatchEvent(evt);
    }
}

function addPlayTime(seconds) {
    const profile = getPlayerProfile();
    console.log("⏱️ Adding play time:", seconds, "seconds - Current total:", profile.temps, "seconds");
    profile.temps += seconds;
    savePlayerProfile(profile);

    if (!window.CJEngine?.tracksPlayTime && window.CJajlkAccount && typeof window.CJajlkAccount.addPlayTime === "function") {
      window.CJajlkAccount.addPlayTime("breaker", seconds);
    }
    
    // Vérification
    const verified = getPlayerProfile();
    console.log("✅ Total play time after save:", verified.temps, "seconds (", Math.floor(verified.temps / 3600), "h", Math.floor((verified.temps % 3600) / 60), "m)");
}

function setMascotte(name) {
    const profile = getPlayerProfile();
    profile.mascotte = name;
    savePlayerProfile(profile);
    renderProfile(profile);
}

function getOrbes(type) {
    return getOrbCount(type);
}

// ====================================
// INITIALIZATION
// ====================================

let player = null;

window.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Profile.js loaded");
    
    // Vérifier si nous sommes sur la page de profil
    const isProfilePage = document.querySelector('.profile-page') !== null;
    
    if (!isProfilePage) {
        console.log("ℹ️ Not on profile page, skipping profile rendering");
        return;
    }
    
    console.log("📄 Profile page detected, initializing...");
    console.log("📄 Document ready state:", document.readyState);
    
    // Load or create profile
    player = getPlayerProfile();
    
    // Save if it's a new profile
    if (!localStorage.getItem(PROFILE_KEY)) {
        console.log("💾 Creating new profile...");
        savePlayerProfile(player);
    }
    
    console.log("📊 Player profile:", player);
    
    renderProfile(player);
    setupPseudoEdit();
    setupNavigation();


    // Rafraîchit l’UI du profil dès qu’un gain/dépense a lieu, même si l’action vient d’un autre module (gameplay)
    window.addEventListener('diamondsChanged', () => {
        renderProfile(getPlayerProfile());
    });

    document.addEventListener("languagechange", () => {
      renderProfile(getPlayerProfile());
    });
    
    console.log("✅ Profile page initialized");
});

// ====================================
// GLOBAL EXPORTS
// ====================================

// 🛠️ Fonction utilitaire pour diagnostiquer et réinitialiser les compagnons
window.debugCompanions = function() {
    const profile = getPlayerProfile();
    console.log("🔍 DIAGNOSTIC DES COMPAGNONS");
    console.log("================================");
    console.log("Compagnons débloqués:", profile.unlockedCompanions);
    console.log("Compagnon équipé:", profile.equippedCompanion);
    console.log("Stats des compagnons:", profile.companions);
    console.log("================================");
    console.log("💡 Pour réinitialiser les compagnons à Aube seulement:");
    console.log("   resetCompanionsToAube()");
};

window.resetCompanionsToAube = function() {
    const profile = getPlayerProfile();
    profile.unlockedCompanions = ["aube"];
    profile.equippedCompanion = "aube";
    savePlayerProfile(profile);
    console.log("✅ Compagnons réinitialisés à Aube uniquement");
    console.log("🔄 Rafraîchissez la page pour voir les changements");
    return profile;
};

// ===================================
// 🎮 DEVTOOLS - CONSOLE DE TEST
// ===================================
window.addGems = function(amount = 1000) {
    const profile = getPlayerProfile();
    const oldAmount = profile.diamants;
    profile.diamants += amount;
    savePlayerProfile(profile);
    console.log(`💎 Gemmes ajoutées: ${oldAmount} → ${profile.diamants} (+${amount})`);
    if (typeof renderProfile === 'function') {
        renderProfile(profile);
    }
    return profile.diamants;
};

window.setGems = function(amount = 1000) {
    const profile = getPlayerProfile();
    profile.diamants = amount;
    savePlayerProfile(profile);
    console.log(`💎 Gemmes définies à: ${amount}`);
    if (typeof renderProfile === 'function') {
        renderProfile(profile);
    }
    return profile.diamants;
};

window.showDevTools = function() {
    console.log("%c🎮 OUTILS DE DÉVELOPPEMENT ACTIVÉS 🎮", "color: #FFD700; font-size: 16px; font-weight: bold;");
    console.log("%cCommandes disponibles:", "color: #00FF00; font-weight: bold;");
    console.log("%caddGems(amount)  → Ajouter des gemmes (défaut: 1000)", "color: #00FF00;");
    console.log("%csetGems(amount)  → Définir les gemmes à un montant spécifique", "color: #00FF00;");
    console.log("Exemples:");
    console.log("  addGems(500)  // Ajoute 500 gemmes");
    console.log("  addGems()     // Ajoute 1000 gemmes par défaut");
    console.log("  setGems(9999) // Définit à 9999 gemmes");
};

// Afficher les devtools au chargement en développement
if (typeof window !== 'undefined') {
    window.showDevTools();
}

window.Profile = {
    player,
    saveProfile,
    addXP,
    addDiamants,
    addPlayTime,
    setMascotte,
    getOrbes
};








