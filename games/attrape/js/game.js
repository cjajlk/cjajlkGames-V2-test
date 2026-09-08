/* =========================================================
   🎮 NOCTURNE ENGINE — V4
   ========================================================= */

const GAME_VERSION = "1.2.0";
let lastVersion = null;

document.addEventListener("DOMContentLoaded", () => {
    const profile = loadPlayerProfile(); // Charge les données du profil sauvegardé
    checkGameVersion(profile);
    updateHUD();         // Mets à jour l'affichage de l'interface utilisateur (ex : Coins, XP)
    startMascotteLoop();
     const dialogMascotteImg = document.getElementById("dialogMascotteImg");
    const versionDisplay = document.getElementById("gameVersionDisplay");

    if (versionDisplay) {
        versionDisplay.textContent = "Version " + GAME_VERSION;
    }

    // Vérifie si l'élément existe
    if (!dialogMascotteImg) {
        console.error("L'élément 'dialogMascotteImg' n'a pas été trouvé !");
        return; // Si l'élément n'est pas trouvé, on arrête l'exécution ici
    }

    // Maintenant on peut manipuler l'image de la mascotte
    dialogMascotteImg.src = "assets/images/mascotte/girl1_idle.png"; // Exemple de mise à jour de l'image

    // 🔥 Charger thème sauvegardé
const savedTheme = localStorage.getItem("equippedTheme");
if (savedTheme && GameData.backgrounds) {
    const bg = GameData.backgrounds.find(b => b.id === savedTheme);
    if (bg) applyTheme(bg);
}

    // 🔎 Masquer le combo dès que le mode campagne est détecté dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameModeParam = urlParams.get('mode');
    if (gameModeParam === 'campaign') {
        document.body.classList.add('campaign-mode-active');
        const hudCombo = document.getElementById('hudCombo');
        if (hudCombo) {
            hudCombo.style.display = 'none';
            hudCombo.style.opacity = '0';
        }
    } else {
        document.body.classList.remove('campaign-mode-active');
    }

    if (typeof window.syncHudVisibility === "function") {
        window.syncHudVisibility();
    }

});

const Game = {
    canvas: null,
    ctx: null,
    assets: {},
    running: false
};

function resizeCanvas() {
    const canvas = document.getElementById("gameCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();


window.mascotteLoseLines = window.mascotteLoseLines ?? [
    "Aie… C’était chaud ! 😖",
    "Encore un effort ! 💪",
    "Pas mal, mais tu peux mieux faire ! ⭐",
    "On réessaie ? 😊"
];


let gameLoopId = null;      // ID du requestAnimationFrame
let isGameRunning = false;   // vrai pendant une partie
let lastFrameTime = 0;


/* =========================================================
   💾 SAUVEGARDE / CHARGEMENT — VERSION STABLE
   ========================================================= */

function savePlayerProfile() {
    let profile = {
        playerName: playerName,
        coins: coins,
        gems: gems,
        highScore: highScore,
        totalPoints: playerTotalPoints,
        totalPlayTime: totalPlayTime,
        unlockedTitles: unlockedTitles,
        equippedTitle: equippedTitle,
        playerLevel: playerLevel,
        playerXP: playerXP,
        currentLanguage: currentLanguage,
        lastVersion: lastVersion,
        playerBadge
    };

    if (typeof ownedMascotte !== "undefined") profile.ownedMascotte = ownedMascotte;
    if (typeof ownedOrbs !== "undefined") profile.ownedOrbs = ownedOrbs;
    if (typeof ownedBackgrounds !== "undefined") profile.ownedBackgrounds = ownedBackgrounds;
    if (typeof ownedPacks !== "undefined") profile.ownedPacks = ownedPacks;
    if (typeof equippedMascotte !== "undefined") profile.equippedMascotte = equippedMascotte;
    if (typeof equippedOrb !== "undefined") profile.equippedOrb = equippedOrb;
    if (typeof equippedBackground !== "undefined") profile.equippedBackground = equippedBackground;
    if (typeof equippedTheme !== "undefined") profile.equippedTheme = equippedTheme;
    if (typeof mascotteSide !== "undefined") profile.mascotteSide = mascotteSide;
    if (typeof coffreDerniereUtilisation === "number") {
        profile.coffreDerniereUtilisation = coffreDerniereUtilisation;
    }

    // Conserver les données supplémentaires déjà présentes dans le profil sauvegardé
    try {
        const existingProfile = JSON.parse(localStorage.getItem("nocturnePlayerProfileV3") || "{}");
        profile = { ...existingProfile, ...profile };
    } catch (e) {
        console.warn("Impossible de fusionner le profil existant :", e);
    }

    // Sauvegarde centralisée du profil complet
    localStorage.setItem("nocturnePlayerProfileV3", JSON.stringify(profile));

    // Sauvegardes individuelles (uniquement si tu en as vraiment besoin ailleurs)
    localStorage.setItem("playerXP", playerXP);
    localStorage.setItem("highScore", highScore);
    localStorage.setItem("playerTotalPoints", playerTotalPoints);
    localStorage.setItem("totalPlayTime", totalPlayTime);
    localStorage.setItem("playerLevel", playerLevel);
    localStorage.setItem("playerName", playerName);

    if (typeof ownedMascotte !== "undefined") {
        localStorage.setItem("ownedMascotte", JSON.stringify(ownedMascotte));
    }
    if (typeof ownedOrbs !== "undefined") {
        localStorage.setItem("ownedOrbs", JSON.stringify(ownedOrbs));
    }
    if (typeof ownedBackgrounds !== "undefined") {
        localStorage.setItem("ownedBackgrounds", JSON.stringify(ownedBackgrounds));
    }
    if (typeof ownedPacks !== "undefined") {
        localStorage.setItem("ownedPacks", JSON.stringify(ownedPacks));
    }
    if (typeof equippedMascotte !== "undefined") {
        localStorage.setItem("equippedMascotte", equippedMascotte);
    }
    if (typeof equippedOrb !== "undefined") {
        localStorage.setItem("equippedOrb", equippedOrb);
    }
    if (typeof equippedBackground !== "undefined") {
        localStorage.setItem("equippedBackground", equippedBackground);
    }
    if (typeof equippedTheme !== "undefined") {
        localStorage.setItem("equippedTheme", equippedTheme);
    }
    if (typeof mascotteSide !== "undefined") {
        localStorage.setItem("mascotteSide", mascotteSide);
    }
    if (typeof coffreDerniereUtilisation === "number") {
        localStorage.setItem(
            "coffreDerniereUtilisation",
            coffreDerniereUtilisation.toString()
        );
    }

    console.log("🎚️ Profil sauvegardé :", profile);
}

/* =========================================================
   💾 CHARGEMENT DU PROFIL — VERSION STABLE
   ========================================================= */

// Charger le profil du joueur au démarrage
function loadPlayerProfile() {
    const savedProfile = localStorage.getItem("nocturnePlayerProfileV3");

    if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        playerName = profile.playerName || "Invité";
        coins = profile.coins || 0;
        gems = profile.gems || 0;
        highScore = profile.highScore || 0;  // Vérifier que highScore est bien chargé
        playerTotalPoints = profile.totalPoints || 0; // Points totaux
        playerXP = profile.playerXP || 0;
        currentLanguage = profile.currentLanguage || "fr";
        window.currentLanguage = currentLanguage;
        lastVersion = profile.lastVersion || null;
        playerLevel = getLevelFromTotalPoints(playerTotalPoints);  // Calculer le niveau à partir des points
        totalPlayTime = profile.totalPlayTime || 0;
        unlockedTitles = profile.unlockedTitles || [];
        equippedTitle = profile.equippedTitle || null;
        if (typeof profile.coffreDerniereUtilisation === "number") {
            coffreDerniereUtilisation = profile.coffreDerniereUtilisation;
        }

       // Vérifie si le titre est correctement récupéré et affiché
const playerBadge = document.getElementById("playerBadge");
if (equippedTitle) {
    playerBadge.textContent = equippedTitle;  // Mettre le titre dans le badge
    playerBadge.classList.remove("hidden");  // Assurer que la classe 'hidden' est retirée
    playerBadge.style.display = "block";  // S'assurer que le badge est visible
} else {
    playerBadge.classList.add("hidden");  // Si pas de titre, garder le badge caché
    playerBadge.style.display = "none";  // Masquer explicitement
}

        const corrections = validateProfileState();
        if (corrections.length) {
            console.warn("🛠️ Profil corrigé :", corrections.join(", "));
            savePlayerProfile();
        }

        console.log("🎮 Profil chargé :", profile);
        if (typeof window.applyTranslations === "function") {
            window.applyTranslations();
        }
        return profile;
    } else {
        return createDefaultProfile();  // Créer un profil par défaut si rien n'est trouvé
    }
}






/* =========================================================
   🌱 PROFIL PAR DÉFAUT
   ========================================================= */

function createDefaultProfile() {
    playerName        = "Invité";
    coins             = 0;
    gems              = 0;
    highScore         = 0;
    playerTotalPoints = 0;
    totalPlayTime     = 0;
    unlockedTitles    = [];
    equippedTitle     = null;
    playerLevel       = 1;
    playerXP          = 0;
    currentLanguage   = "fr";
    window.currentLanguage = currentLanguage;
    lastVersion       = GAME_VERSION;

    console.log("✨ Profil par défaut créé.");

    validateProfileState();

    savePlayerProfile();

    return { lastVersion: lastVersion };
}

function checkGameVersion(profile) {
    if (!profile) return;
    if (!profile.lastVersion) {
        profile.lastVersion = GAME_VERSION;
        lastVersion = GAME_VERSION;
        savePlayerProfile();
        return;
    }

    if (profile.lastVersion !== GAME_VERSION) {
        showUpdatePopup(profile.lastVersion, GAME_VERSION);
        profile.lastVersion = GAME_VERSION;
        lastVersion = GAME_VERSION;
        savePlayerProfile();
    }
}

function showUpdatePopup(oldVersion, newVersion) {
    const popup = document.createElement("div");
    popup.className = "update-popup";
    popup.innerHTML = `
        <div class="update-box">
            <h3>✨ Mise a jour disponible</h3>
            <p>Le jeu est passe de la version ${oldVersion} a ${newVersion}.</p>
            <p>Merci de faire partie de l'aventure nocturne.</p>
            <button id="closeUpdate">Continuer</button>
        </div>
    `;

    document.body.appendChild(popup);

    const closeBtn = popup.querySelector("#closeUpdate");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            popup.remove();
        });
    }
}

function validateProfileState() {
    const corrections = [];

    if (!Number.isFinite(coins) || coins < 0) {
        coins = 0;
        corrections.push("coins");
    }
    if (!Number.isFinite(gems) || gems < 0) {
        gems = 0;
        corrections.push("gems");
    }
    if (!Number.isFinite(playerTotalPoints) || playerTotalPoints < 0) {
        playerTotalPoints = 0;
        corrections.push("totalPoints");
    }

    return corrections;
}

window.setCurrentLanguage = function (lang) {
    if (!lang) return;
    currentLanguage = lang;
    window.currentLanguage = currentLanguage;
};

window.resetPlayerProfile = function () {
    localStorage.removeItem("nocturnePlayerProfileV3");
    createDefaultProfile();
    if (typeof updateProfilePanel === "function") updateProfilePanel();
    if (typeof window.updateCurrenciesHUD === "function") window.updateCurrenciesHUD();
    if (typeof window.updateShop === "function") window.updateShop();
};

/* =========================================================
   🖥️ MISE À JOUR DES AFFICHAGES (HUD + PROFIL + BOUTIQUE)
   ========================================================= */

function updateAllProfileUI() {
    if (document.getElementById("gemCountHUD"))
        document.getElementById("gemCountHUD").textContent = gems;

    if (document.getElementById("shopGemCount"))
        document.getElementById("shopGemCount").textContent = gems;

    if (document.getElementById("profileGemCount"))
        document.getElementById("profileGemCount").textContent = gems;

    if (document.getElementById("profileName"))
        document.getElementById("profileName").textContent = playerName;

    if (document.getElementById("profileLevel"))
        document.getElementById("profileLevel").textContent = playerLevel;

    if (document.getElementById("profileXP"))
        document.getElementById("profileXP").textContent = playerXP;

  // Mise à jour du total des points dans l'interface
    if (document.getElementById("profileTotalPoints"))
        document.getElementById("profileTotalPoints").textContent = playerTotalPoints;
}

// =========================================================
// 🎯 SPAWN D’ORBES (version unique optimisée mobile + PC)
// =========================================================

// Fonction de génération des orbes avec couleur en fonction du niveau
const orbImageCache = new Map();

function getCachedImage(src) {
    if (!src) return null;
    let img = orbImageCache.get(src);
    if (!img) {
        img = new Image();
        img.src = src;
        orbImageCache.set(src, img);
    }
    return img;
}

function preloadOrbImages(data) {
    if (!data || !Array.isArray(data.orbeSkins)) return;
    data.orbeSkins.forEach(orb => {
        if (orb && orb.img) getCachedImage(orb.img);
    });
    getCachedImage("assets/item/aura_violet.png");
}

function spawnOrb() {


    // 🔒 Sécurité : ne rien faire si le jeu est en pause ou arrêté
    if (!isGameRunning || isGamePaused || !Game.running) return;

    if (!GameData.orbeSkins || GameData.orbeSkins.length === 0) return;

    const availableOrbs = GameData.orbeSkins.filter(o => !o.disabled);
if (availableOrbs.length === 0) return;


    // Sélection de l'orbe aléatoire
   const randomOrb = availableOrbs[
  Math.floor(Math.random() * availableOrbs.length)
];


    /* 📱🔍 Optimisation mobile
       - Taille ajustée
       - Zones évitées : top HUD / bas mascotte
       - Spawn centré pour le doigt
    */
    const isMobile = window.innerWidth < 820;
    const orbSize = isMobile ? 75 : 100;

    

    // Zone sécurisée
    const SAFE_TOP = isMobile ? 140 : 100;       // Évite HUD XP / Score
    const SAFE_BOTTOM = isMobile ? 260 : 200;    // Évite zone mascotte
    const SAFE_MARGIN = 30;                      // Bordures gauche/droite

    // Calculs de la position aléatoire des orbes
    const x = SAFE_MARGIN + Math.random() * (Game.canvas.width - orbSize - SAFE_MARGIN * 2);
    const y = SAFE_TOP + Math.random() * (Game.canvas.height - SAFE_TOP - SAFE_BOTTOM - orbSize);

    // Lifetime ajusté si écran petit
    const lifetime = isMobile ? 160 : 250;

    // Appel à la fonction pour obtenir la couleur en fonction du niveau
    const color = getColorForLevel(playerLevel);  // Couleur selon le niveau du joueur

    console.log("Couleur de l'orbe générée :", color);  // Affiche la couleur dans la console pour vérification

    // Créer l'orbe avec la couleur définie
    const orb = {
  orbid: randomOrb.id,
  x,
  y,
  size: orbSize,
    img: getCachedImage(randomOrb.img),
    auraImg: getCachedImage("assets/item/aura_violet.png"),
  lifetime,
  color
};

orb.isEquipped = (orb.orbid === equippedOrb);



    console.log("ORB", orb.id, "équipée ?", orb.isEquipped, "equipedOrb =", equippedOrb);


    // Ajout de l'orbe dans le tableau des cibles
    targets.push(orb);

   
}


// Fonction pour générer des couleurs évolutives selon le niveau du joueur
function getColorForLevel(level) {
    if (level <= 1) {
        return "white";  // Couleur de départ
    } else if (level <= 4) {
        return "blue";  // Bleu pour les premiers niveaux
    } else if (level <= 7) {
        return "green";  // Vert pour les niveaux moyens
    } else if (level <= 10) {
        return "orange";  // Orange pour les niveaux élevés
    } else {
        return "red";  // Rouge pour les niveaux très élevés
    }
}

// Fonction d'affichage des orbes avec la couleur appliqué

function drawOrb(orb) {
    const ctx = Game.ctx;
    if (!ctx) return;

    // ✨ AURA IMAGE — uniquement si équipée
    if (orb.isEquipped && orb.auraImg) {

        const baseScale = 1.55;

       // pulsation plus lisible MAIS toujours élégante
const pulse = Math.sin(auraTime * 1.8) * 0.07;

        const auraScale = baseScale + pulse;
        const auraSize = orb.size * auraScale;

        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.filter = "blur(3px)";

        ctx.drawImage(
            orb.auraImg,
            orb.x - (auraSize - orb.size) / 2,
            orb.y - (auraSize - orb.size) / 2,
            auraSize,
            auraSize
        );

        ctx.restore();
    }

    // 🔵 ORBE
    if (orb.img) {
        ctx.drawImage(orb.img, orb.x, orb.y, orb.size, orb.size);
    }
}

// Le spawn est gere dans la boucle rAF via spawnTimerMs

















/* =========================================================
   🎵 AUDIO GLOBAL (MUSIQUE + SFX)
   ========================================================= */

// Musique de fond (playlist)
const musicPlaylist = [
    "assets/audio/music1.mp3",
    "assets/audio/music2.mp3",
    "assets/audio/music3.mp3",
    "assets/audio/music4.mp3",
    "assets/audio/music5.mp3",
    "assets/audio/music6.mp3",
    "assets/audio/music7.mp3",
    "assets/audio/music8.mp3",
    "assets/audio/intro_theme.mp3"
];

let bgm = null;
let currentTrackIndex = 0;
let musicEnabled = true;
let musicInitialized = false;

// SFX
const sfx_pop = new Audio("assets/audio/pop.mp3");
sfx_pop.volume = 0.35;

const sfx_fail = new Audio("assets/audio/fail.mp3");
sfx_fail.volume = 0.45;




/* =========================================================
   📦 SYSTEME D’ASSETS
   ========================================================= */

const GameAssets = window.GameAssets = {
    images: {
        menuMascotte: null,
        menuOrbe: null,
    },
    load(list) {
        return new Promise(resolve => {
            let toLoad = list.length;
            if (toLoad === 0) resolve();

            list.forEach(asset => {
                const img = new Image();
                img.src = asset.src;

                img.onload = () => {
                    GameAssets.images[asset.id] = img;
                    if (--toLoad === 0) resolve();
                };

                img.onerror = () => {
                    console.error("❌ Impossible de charger :", asset.src);
                    if (--toLoad === 0) resolve();
                };
            });
        });
    }
};

const MenuAssetsList = [
    { id: "menu_mascotte_idle", src: "assets/images/menu/lyra_idle.png" },
    { id: "menu_mascotte_blink", src: "assets/images/menu/lyra_blink.png" },
    { id: "menu_mascotte_happy", src: "assets/images/menu/lyra_pulse.png" },
    { id: "menu_mascotte_sad", src: "assets/images/menu/lyra_breath.png" },

    
    
];


// Index du fond actuel (0 = premier fond du JSON)
let currentBackgroundIndex = 0;




function buildAssetsMap(GameData) {
    const mascotte =
        GameData.mascotteSkins.find(m => m.id === equippedMascotte) ||
        GameData.mascotteSkins[0];

    const orbe =
        GameData.orbeSkins.find(o => o.id === equippedOrb) ||
        GameData.orbeSkins[0];

    const bg =
        GameData.backgrounds[currentBackgroundIndex] ||
        GameData.backgrounds[0];

    return [
        { id: "background", src: bg.img },
        { id: "orb", src: orbe.img },
        { id: "mascotte", src: mascotte.img }
    ];
}

function applyBackgroundFromIndex() {

    const owned = JSON.parse(localStorage.getItem("ownedBackgrounds") || "[]");

    // 🌿 fonds disponibles = pas disabled
    const availableBackgrounds = GameData.backgrounds.filter(bg => !bg.disabled);

    if (!availableBackgrounds.length) return;

    if (typeof currentBackgroundIndex !== "number" || isNaN(currentBackgroundIndex)) {
        currentBackgroundIndex = 0;
    }

    currentBackgroundIndex =
        (currentBackgroundIndex + availableBackgrounds.length) %
        availableBackgrounds.length;

    const bgData = availableBackgrounds[currentBackgroundIndex];

    const img = new Image();
    img.src = bgData.img;

    img.onload = () => {
        Game.assets.background = img;
    };

    Game.currentBackgroundId = bgData.id;
}









/* =========================================================
   🎵 MUSIQUE — INIT + CROSSFADE
   ========================================================= */

function initMusic() {
    if (musicInitialized) return;

    bgm = new Audio();
    bgm.loop = false;

    bgm.addEventListener("ended", () => {
        nextTrack();
    });

    musicInitialized = true;
    playCurrentTrack();
}

function playCurrentTrack() {
    if (!musicEnabled || !bgm) return;

    bgm.src = musicPlaylist[currentTrackIndex];
    bgm.volume = 0;

    bgm.play().then(() => {
        let v = 0;
        const fade = setInterval(() => {
            if (!bgm) {
                clearInterval(fade);
                return;
            }
            v += 0.05;
            bgm.volume = Math.min(0.6, v);
            if (v >= 0.6) clearInterval(fade);
        }, 120);
    }).catch(() => {
        // autoplay bloqué, on réessaiera plus tard
    });
}

function nextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % musicPlaylist.length;
    playCurrentTrack();
}

function crossfadeToNextTrack() {
    if (!bgm) return;

    let oldTrack = bgm;
    let volume = oldTrack.volume;

    const fadeOut = setInterval(() => {
        volume -= 0.05;
        if (volume <= 0) {
            clearInterval(fadeOut);
            oldTrack.pause();
            nextTrack();
        }
        oldTrack.volume = Math.max(0, volume);
    }, 80);
}

// Bouton musique
const btnMusic = document.getElementById("btnMusic");
if (btnMusic) {
    btnMusic.onclick = () => {
        musicEnabled = !musicEnabled;
        if (!musicEnabled && bgm) {
            bgm.pause();
            btnMusic.textContent = "🔇";
        } else {
            btnMusic.textContent = "🔊";
            if (!musicInitialized) {
                initMusic();
            } else {
                playCurrentTrack();
            }
        }
    };
}

/* =========================================================
   🌌 TRANSITION CINEMATIQUE DE FOND
   ========================================================= */

function transitionBackgroundCinematic(nextBackgroundCallback) {
    const canvas = Game.canvas;
    const swipe = document.getElementById("bgSwipe");
    if (!canvas || !swipe) {
        nextBackgroundCallback();
        return;
    }

    inLevelTransition = true;

    // swipe magique
    swipe.classList.add("bgSwipe-run");

    // glow + blur + fade
    canvas.classList.add("canvas-glow", "canvas-radial");
    canvas.style.opacity = 0;

    setTimeout(() => {
        nextBackgroundCallback();
        canvas.style.opacity = 1;

        setTimeout(() => {
            canvas.classList.remove("canvas-glow", "canvas-radial");
            swipe.classList.remove("bgSwipe-run");
            inLevelTransition = false;
        }, 800);

    }, 450);
}

/* =========================================================
   🎮 INIT JEU
   ========================================================= */

let canvasInitialized = false;

async function startGame(GameData) {
    // Restaurer le plein écran s'il était activé
    if (typeof window.restoreFullscreen === "function") {
        window.restoreFullscreen();
    }
    
    if (!Game.canvas) {
        Game.canvas = document.getElementById("gameCanvas");
        Game.ctx = Game.canvas.getContext("2d");
        resizeGame();
        window.addEventListener("resize", resizeGame);
    }

    if (!canvasInitialized) {
        Game.canvas.addEventListener("click", onGameClick);
        canvasInitialized = true;
    }

    preloadOrbImages(GameData);
    const assetList = buildAssetsMap(GameData);
    await GameAssets.load(assetList);

    Game.assets = {
        background: GameAssets.images.background,
        orb: GameAssets.images.orb,
        mascotte: GameAssets.images.mascotte,

        // ✨ AURA ORBE ÉQUIPÉE
    orbAura: GameAssets.images.orb_aura
    };

    initRender();
}

function resizeGame() {
    if (!Game.canvas) return;
    Game.canvas.width = window.innerWidth;
    Game.canvas.height = window.innerHeight;
}



/* =========================================================
   🎯 VARIABLES DE GAMEPLAY
   ========================================================= */

let targets = [];
let particles = [];
let floatTexts = [];
let shockwaves = [];
let gameState = {};

let misses = 0;
let missesMax = 15;
let score = 0;
let levelRewardGiven = false;

// Spawn & difficulté
let spawnTimerMs = 0;
let spawnRate = 60;      // valeur courante (évolue pendant la partie)
let difficultyTier = 2;  // 1 = facile, 2 = normal, 3 = difficile, 4 = expert


let gameStarted = false;     // mode normal
let timerRunning = false;    // mode timer
let inLevelTransition = false;
let sessionStartTime = 0;
let sessionActiveMs = 0;
let sessionTimeCommitted = true;
let auraTime = 0;

let level = 1;
let levelTargetNormal = 20;
let isGamePaused = false;
let objectiveReached = false;  // Ajoute cette ligne au début du script

window.getGameState = function () {
    return {
        running: Game.running && isGameRunning && (gameStarted || timerRunning) && !inLevelTransition,
        paused: isGamePaused
    };
};

function startSessionTimeTracking() {
    window.CJEngine?.suspend?.();
    sessionStartTime = Date.now();
    sessionActiveMs = 0;
    sessionTimeCommitted = false;
}

function commitSessionPlayTime() {
    if (sessionTimeCommitted) return 0;

    const elapsedSeconds = Math.floor(sessionActiveMs / 1000);
    sessionTimeCommitted = true;

    if (elapsedSeconds <= 0) return 0;

    totalPlayTime += elapsedSeconds;

    if (!window.CJEngine?.tracksPlayTime && window.CJajlkAccount && typeof window.CJajlkAccount.addPlayTime === "function") {
        window.CJajlkAccount.addPlayTime("attrape", elapsedSeconds);
    }

    return elapsedSeconds;
}

let lastObjectiveIndex = -1; // Index du dernier objectif atteint

let timerValue = 100;
let timerSpeed = 0.09;
let timerBackgroundElapsed = 0;
const TIMER_BG_INTERVAL = 240; // 4 minutes = 240 secondes
let currentMode = "normal";

// --- MODE COMBO ---
let comboCount = 0;          // clics consécutifs réussis
let comboTarget = 10;         // nombre de clics pour valider un combo
let totalComboSuccess = 0;   // total de combos validés (pour gemmes)
let comboGemBonus = false; // indique si on doit afficher “+1 💎”
let menuBlinkTimer = null;

// 🌙 Coffre nocturne — session uniquement
let coffreUtiliseSession = 0;
const COFFRE_MAX_SESSION = 3;
// ⏱️ Coffre nocturne — cooldown
const COFFRE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
let coffreDerniereUtilisation = 0;
let pubEnCours = false;
const BETA_MODE = true; // ← ON pour itch.io, OFF plus tard (Android/pub)

;



let updateMenuMascotteId = null;
let stopMenuMascotteAnimation = false;


let mascotteState = "idle";  // État initial
let mascotteTimer = null;

window.updateMenuMascotteId = updateMenuMascotteId;

// 🌙 Charger le dernier usage du coffre (persistant)
const savedCoffreTime = localStorage.getItem("coffreDerniereUtilisation");
if (savedCoffreTime) {
    coffreDerniereUtilisation = parseInt(savedCoffreTime, 10);
}


/* =========================================================
   🌙 MOTEUR D'ANIMATION MASCOTTE
   ========================================================= */

function getMascotteSprites() {
    let id = localStorage.getItem("at_mascotteSkin");
    
    // Vérifie si l'id est défini, sinon on utilise "girl1"
    if (!id) {
        console.warn("Aucune mascotte équipée, utilisation de la valeur par défaut : girl1");
        id = "girl1";  // valeur par défaut
    }

    // Retourne les sprites avec les bons chemins d'images
  return {
    idle: "assets/images/mascotte/girl1_idle.png",
    blink: "assets/images/mascotte/girl1_blink.png",
    happy: "assets/images/mascotte/girl1_happy.png",
    sad: "assets/images/mascotte/girl1_sad.png"
};

}

// Change l’image affichée
function setMascotteState(state) {
    // Vérifie que l'élément dialogMascotteImg existe avant de l'utiliser
    const dialogMascotteImg = document.getElementById("dialogMascotteImg");
    
    if (!dialogMascotteImg) {
        console.error("L'élément 'dialogMascotteImg' n'a pas été trouvé !");
        return; // Si l'élément n'est pas trouvé, on arrête l'exécution de la fonction
    }

    // Récupère les sprites de la mascotte
    const sprites = getMascotteSprites();
    
    // Vérifie si les sprites sont bien récupérés avant de les utiliser
    if (!sprites) {
        console.error("Les sprites de la mascotte sont introuvables !");
        return; // Si sprites n'existe pas, on arrête l'exécution
    }

    // Change l'image de la mascotte selon l'état
    switch (state) {
        case "idle":
            dialogMascotteImg.src = sprites.idle; // Assurez-vous que l'ID 'idle' existe dans sprites
            break;
        case "blink":
            dialogMascotteImg.src = sprites.blink; // Assurez-vous que l'ID 'blink' existe dans sprites
            break;
        case "happy":
            dialogMascotteImg.src = sprites.happy; // Assurez-vous que l'ID 'happy' existe dans sprites
            break;
        case "sad":
            dialogMascotteImg.src = sprites.sad; // Assurez-vous que l'ID 'sad' existe dans sprites
            break;
        default:
            console.error("État de la mascotte inconnu :", state);
            break;
    }
}













function startMascotteLoop() {
    clearTimeout(mascotteTimer);  // On réinitialise le timer à chaque appel

    // Choix de l'animation idle ou blink de manière aléatoire
    const randomDelay = 3000 + Math.random() * 2500;  // Intervalle aléatoire
    mascotteTimer = setTimeout(() => {
        if (mascotteState === "idle") {
            setMascotteState("blink");
        } else {
            setMascotteState("idle");
        }

        // Prochaine animation après un délai
        setTimeout(() => {
            startMascotteLoop();  // Relance la boucle avec un délai
        }, 180);  // Délai entre blink et idle

    }, randomDelay);
}



/* =========================================================
   👤 PROFIL JOUEUR — DONNÉES, NIVEAUX & SAUVEGARDE
   ========================================================= */

// --- Données de base ---
let playerName        = "Joueur";
let equippedTitle     = null;    
let unlockedTitles    = [];
let highScore         = 0;
let totalPlayTime     = 0;

// --- XP & Niveaux ---
// Remplacement de playerXP par playerTotalPoints
let playerTotalPoints = 0; // Points totaux
let playerLevel = 1; // Niveau basé sur playerTotalPoints
let playerXP    = 0;
let xpToNext    = 100;
let currentLanguage = "fr";

const SEASON_MAX_LEVEL = 30;   // Cap Saison 1

/* =========================================================
   🌱 XP VISUELLE UNIQUEMENT
   ========================================================= */
function addXP(value) {
    if (!value || value <= 0) return;
    // rien d'autre ici
    updateHUD();
}





/* =========================================================
   🎖 TITRES (déblocage points cumulés)
   ========================================================= */
const PlayerTitles = [
    { id: "novice",    name: "Novice nocturne",      threshold: 1000},
    { id: "chasseur",  name: "Chasseur d’orbes",     threshold: 12000 },
    { id: "veilleur",  name: "Veilleur des ruelles", threshold: 24000 },
    { id: "gardien",   name: "Gardien des lueurs",   threshold: 48000 },
    { id: "luminary",  name: "Âme Lumineuse",        threshold: 96000 },
    { id: "oracle",    name: "Oracle Nocturne",      threshold: 192000 }
];


function applyLoadedProfile(p = {}) {

    playerName = p.playerName ?? "Invité";
    coins = p.coins ?? 0;
    gems = p.gems ?? 0;
    highScore = p.highScore ?? 0;
    playerTotalPoints = p.playerTotalPoints ?? 0;
    totalPlayTime = p.totalPlayTime ?? 0;
    unlockedTitles = p.unlockedTitles ?? [];
    equippedTitle = p.equippedTitle ?? "Aucun";

    // XP chargée → OK
    playerXP = p.playerXP ?? 0;
    currentLanguage = p.currentLanguage ?? "fr";
    window.currentLanguage = currentLanguage;

    playerLevel = getLevelFromTotalPoints(playerTotalPoints);


    savePlayerProfile();
    updateProfilePanel();

    console.log("✔ Profil chargé :", p);
}

// 🎭 Gestion de la mascotte (Menu + Fin de partie)
function showMascotte(state, imagePath) {
    const mascotteContainer = document.getElementById("dialogMascotte");
    const mascotteImg = document.getElementById("dialogMascotteImg");

    if (!mascotteContainer || !mascotteImg) return;

    // Afficher la mascotte
    mascotteContainer.classList.remove("hidden");

    // Changer l'image de la mascotte selon l'état (fin de partie ou autre)
    mascotteImg.src = imagePath || "assets/images/mascotte/menu/lyra_idle.png"; // Par défaut, une image d'Idle

    // Appliquer une animation ou changer l'état en fonction de l'action
    if (state === "endGame") {
        // Si c'est la fin de partie, on montre l'image de fin
        mascotteImg.src = "assets/images/mascotte/lyra.png"; // Exemple pour fin de partie
    }

    // Autres états peuvent être ajoutés ici si nécessaire (idle, blink, etc.)
}

// Masquer la mascotte de fin de partie
function hideMascotte() {
    const mascotteContainer = document.getElementById("dialogMascotte");
    if (mascotteContainer) mascotteContainer.classList.add("hidden");
}


/* =========================================================
   🌙 MASCOTTE DIALOGUE (menu + fin de partie)
   ========================================================= */

const dialogMascotte = document.getElementById("dialogMascotte");
const dialogMascotteImg = document.getElementById("dialogMascotteImg");
const dialogBubble = document.getElementById("dialogBubble");

// Phrases du menu
const mascotMenuLines = [
    "Prêt pour une nouvelle aventure ? ✨",
    "Quelle énergie aujourd’hui !",
    "Choisis ton mode, je suis avec toi 💜",
    "On attrape des orbes ensemble ?",
    "Le monde nocturne t’attend…"
];

// Phrases de défaite
const mascotLoseLines = [
    "Ne t’en fais pas… tu vas y arriver 💜",
    "On recommence ? Je crois en toi !",
    "C’était une belle tentative !",
    "Tu feras mieux la prochaine fois ✨"
];

// Phrases de progression
const mascotNextLevelLines = [
    "Bravo ! On passe au niveau suivant !",
    "Tu t’améliores vraiment !",
    "Continue comme ça ✨",
    "Tu deviens trop fort !"
];

function showMascotteDialog(text, emotion = "idle") {

    if (!dialogMascotte || !dialogMascotteImg || !dialogBubble) {
        console.warn("⚠️ Mascotte manquante dans le DOM.");
        return;
    }

    // Emotion choisie
    setMascotteState(emotion);

    dialogBubble.textContent = text;

    dialogMascotte.classList.remove("hidden");
    setTimeout(() => dialogMascotte.classList.add("visible"), 10);

    // disparition + retour à idle
    setTimeout(() => {
        dialogMascotte.classList.remove("visible");

        setTimeout(() => {
            dialogMascotte.classList.add("hidden");
            setMascotteState("idle");
        }, 400);

    }, 2200);
}


window.showMascotteDialog = showMascotteDialog;

// Fonction appelée pour augmenter les gems
function addGems(amount) {
    console.log("💎 addGems appelé avec :", amount);
    console.log("💎 Gems AVANT :", gems);

    gems = Number(gems) || 0;
    gems += amount;

    console.log("💎 Gems APRÈS :", gems);

    savePlayerProfile();
    updateAllProfileUI();
    updateProfilePanel();
}







// Récompenses quand on monte de niveau
function handleLevelUp(level) {
    let rewardGems = 0;

    if (level === 2) rewardGems = 10;
    else if (level === 3) rewardGems = 15;
    else if (level % 5 === 0) rewardGems = 25;

    if (typeof addGems === "function" && rewardGems > 0) {
        addGems(rewardGems);
    }

    if (typeof showMascotteDialog === "function") {
        const msg = rewardGems > 0
            ? `Bravo ! Niveau ${level} atteint 🎉 (+${rewardGems} 💎)`
            : `Niveau ${level} atteint 🎉`;
        showMascotteDialog(msg);
    }

    console.log("🎚 Niveau up !", { level, playerXP, rewardGems });
}

/* =========================================================
   ⚙️ DIFFICULTÉ DYNAMIQUE EN FONCTION DES POINTS TOTAUX
   (playerTotalPoints)
   ========================================================= */

// Détermine un palier de difficulté à partir du nombre total de points
function getDifficultyTierFromPoints(totalPoints) {
    if (totalPoints <= 1000) return 1;         // Niveau débutant (facile)
    if (totalPoints <= 5000) return 2;         // Niveau moyen (normal)
    if (totalPoints <= 10000) return 3;        // Niveau difficile (pour mode difficile)
    return 4;                                  // Mode expert (si besoin)
}

function updateDifficultyFromPoints() {
    const tier = getDifficultyTierFromPoints(playerTotalPoints); // Utilisation des points totaux pour la difficulté
    difficultyTier = tier;

    // Paramètres de base pour chaque difficulté
    const baseSpawnEasy = 60;
    const baseMissesEasy = 15;
    let baseSpawnRate = baseSpawnEasy;

    switch (tier) {
        case 1: // Facile (niveau débutant)
            baseSpawnRate = 60;
            missesMax = 15;
            break;

        case 2: // Normal (niveau moyen)
            baseSpawnRate = 50;
            missesMax = 14;
            break;

        case 3: // Difficile (niveau avancé)
            baseSpawnRate = 40;
            missesMax = 13;
            break;

        case 4: // Expert (niveau très difficile)
        default:
            baseSpawnRate = 30;
            missesMax = 12;
            break;
    }

    // ⭐ Progression interne au palier
    const tierStart = tier === 1 ? 1 : (tier === 2 ? 1001 : (tier === 3 ? 5001 : 10001));
    const scaling = Math.max(0, playerTotalPoints - tierStart) * 0.4;
    baseSpawnRate -= scaling;

    // ⭐ Mini vagues aléatoires (10%)
    if (Math.random() < 0.10) {
        baseSpawnRate -= 5;
    }

    // Le spawnRate ne doit pas descendre sous 20
    spawnRate = Math.max(20, baseSpawnRate);

    console.log(
        "⚙️ Difficulté mise à jour →",
        "\n  Points totaux :", playerTotalPoints,
        "\n  Palier :", tier,
        "\n  spawnRate :", spawnRate,
        "\n  missesMax :", missesMax
    );
}






// ---------------------------------------------------------
//  Titres (déjà débloqués) en fonction de playerTotalPoints
// ---------------------------------------------------------
function checkTitlesUnlock() {
    let newlyUnlocked = [];

    PlayerTitles.forEach(title => {
        const already = unlockedTitles.includes(title.id);
        if (!already && playerTotalPoints >= title.threshold) {
            unlockedTitles.push(title.id);
            newlyUnlocked.push(title);
        }
    });

    if (newlyUnlocked.length > 0) {
        savePlayerProfile();

        const last = newlyUnlocked[newlyUnlocked.length - 1];
        const msg = "Nouveau titre débloqué : " + last.name + " !";

        if (typeof showMascotteDialog === "function") {
            showMascotteDialog(msg);
        }

        console.log("🎖 Titres débloqués :", newlyUnlocked.map(t => t.name).join(", "));

        if (typeof updatePlayerBadge === "function") {
            updatePlayerBadge();
        }
    }
}


// ---------------------------------------------------------
//  Panel Profil (overlay Profil Joueur)
// ---------------------------------------------------------
function openProfile() {
    const o = document.getElementById("profileOverlay");
    if (!o) return;

    updateProfilePanel();
    o.classList.remove("hidden");
    setTimeout(() => o.classList.add("visible"), 10);
    if (typeof window.syncHudVisibility === "function") window.syncHudVisibility();
}

function closeProfile() {
    const o = document.getElementById("profileOverlay");
    if (!o) return;

    o.classList.remove("visible");
    setTimeout(() => o.classList.add("hidden"), 300);
    if (typeof window.syncHudVisibility === "function") window.syncHudVisibility();
    setTimeout(() => {
        if (typeof window.syncHudVisibility === "function") window.syncHudVisibility();
    }, 320);
}

// Mise à jour du profil dans l'interface
  function updateProfilePanel() {
    const savedName = localStorage.getItem("playerName") || "Invité";
    const pseudoEl = document.getElementById("profilePseudo");
    const highScoreEl = document.getElementById("profileHighScore");
    const totalPointsEl = document.getElementById("profileTotalPoints");
    const playTimeEl = document.getElementById("profilePlayTime");
    const cjEl = document.getElementById("profileCJ");
    const eqEl = document.getElementById("profileEquippedTitle");
    const container = document.getElementById("profileTitlesContainer");

    // METTRE À JOUR LES COINS ET LES GEMMES DANS LE HUD
    const hudCoins = document.getElementById("profileCoins");
    const hudGems = document.getElementById("profileGems");

    if (hudCoins) hudCoins.textContent = coins ?? 0;
    if (hudGems) hudGems.textContent = gems ?? 0;  // Met à jour les gemmes

    // METTRE À JOUR LES DONNÉES DU PROFIL
    if (pseudoEl) pseudoEl.textContent = savedName;
    if (highScoreEl) highScoreEl.textContent = highScore ?? 0;
    if (totalPointsEl) totalPointsEl.textContent = playerTotalPoints ?? 0;
    if (playTimeEl) playTimeEl.textContent = formatPlayTime(totalPlayTime);
    
    // CJ Universels - Source unique: CJajlkAccount
    if (cjEl) {
        const totalCJ = (window.CJajlkAccount && window.CJajlkAccount.getTotal) ? window.CJajlkAccount.getTotal() : 0;
        cjEl.textContent = totalCJ;
    }

    // TITRE ÉQUIPÉ
    if (eqEl) {
        if (equippedTitle) {
            const title = PlayerTitles.find(t => t.id === equippedTitle);
            eqEl.textContent = title ? title.name : "Aucun";
        } else {
            eqEl.textContent = "Aucun";
        }
    }

    // TITRES DÉBLOQUÉS
if (container) {

    container.innerHTML = "";

    // Sécurité : s'assurer que la liste vient bien du profil chargé
    if (!Array.isArray(unlockedTitles)) unlockedTitles = [];

    if (unlockedTitles.length === 0) {
        const empty = document.createElement("div");
        empty.className = "profile-title-empty";
        empty.textContent = "Aucun titre débloqué pour le moment.";
        container.appendChild(empty);
    } 
    else {
        unlockedTitles.forEach(titleId => {
            const title = PlayerTitles.find(t => t.id === titleId);
            if (!title) return;

            const div = document.createElement("div");
            div.className = "profile-title-badge";
            div.textContent = title.name;
            container.appendChild(div);
        });
    }
}
  // METTRE À JOUR playerXP DANS LE HUD
 const xpText = document.getElementById("xpText");
if (xpText) {
   

    // Calcul des points restants pour le niveau suivant
    const pointsRemaining = Math.max(0, xpToNext - playerTotalPoints); 

    // Affichage des informations
    xpText.textContent = `Niv. ${playerLevel} - ${playerTotalPoints} / ${xpToNext} Points (${pointsRemaining} points restants)`;

    // Si le niveau est atteint, afficher "Niveau atteint !"
    if (pointsRemaining === 0 && playerTotalPoints >= xpToNext) {
        xpText.textContent = `Niv. ${playerLevel} - ${playerTotalPoints} / ${xpToNext} Points (Niveau atteint !)`;
    }
}     

 updatePlayerBadge();
        }


    








// petites fonctions utilitaires
function editPseudo() {
  const modal = document.getElementById("pseudoModal");
  const input = document.getElementById("pseudoInput");
  const btn = document.getElementById("pseudoConfirm");

  input.value = playerName || "";
  modal.classList.remove("hidden");
  input.focus();

  btn.onclick = () => {
    const newName = input.value.trim();
    if (!newName) return;

    playerName = newName.substring(0, 20);
    savePlayerProfile();
    updateProfilePanel();

    modal.classList.add("hidden");
  };
}


function formatPlayTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function coffreDisponible() {

    if (BETA_MODE) return false; // 🔒 bloqué en bêta

    if (coffreUtiliseSession >= COFFRE_MAX_SESSION) return false;
    if (coffreEnCooldown()) return false;

    return true;
}


function coffreEnCooldown() {
    const maintenant = Date.now();
    return (maintenant - coffreDerniereUtilisation) < COFFRE_COOLDOWN_MS;
}

function ouvrirCoffreNocturne() {
    if (pubEnCours) return;
pubEnCours = true;

    if (!coffreDisponible()) {
        console.log("🌙 Coffre indisponible (cooldown ou limite)");
        return;
    }

    // 📺 Lancer la pub récompensée
    showRewardedAd(
        () => {
            // ✅ SUCCÈS PUB → récompense
            addGems(5);
            console.log("💎 +5 gemmes via pub");

            coffreUtiliseSession++;
            coffreDerniereUtilisation = Date.now();
            savePlayerProfile();
            pubEnCours = false;
            updateEtatCoffre();
        },
        () => {
            // ❌ ÉCHEC PUB → rien
            console.log("🌙 Aucune récompense (pub non complétée)");
            pubEnCours = false;
            updateEtatCoffre();
        }
    );
}

function updateEtatCoffre() {
    const coffreBtn = document.getElementById("coffreNocturneBtn");
    const coffreText = document.getElementById("coffreNocturneText");

    if (!coffreBtn || !coffreText) return;

    if (coffreDisponible()) {
        coffreBtn.disabled = false;
        coffreBtn.classList.remove("coffre-disabled");
        coffreText.textContent = "🌙 Coffre nocturne – Ouvrir (+5 💎)";
    } else {
    coffreBtn.disabled = true;
    coffreBtn.classList.add("coffre-disabled");

    if (coffreEnCooldown()) {
        const reste = Math.ceil(
            (COFFRE_COOLDOWN_MS - (Date.now() - coffreDerniereUtilisation)) / 1000
        );
        coffreText.textContent = `🌙 Coffre nocturne — revient dans ${reste}s`;
    } else {
        coffreText.textContent = "🌙 Le coffre nocturne se repose";
    }

    if (BETA_MODE) {
    coffreBtn.disabled = true;
    coffreBtn.classList.add("coffre-disabled");
    coffreText.textContent = "🌙 Coffre nocturne bientôt disponible";
    return;
}

}

}

function showCoffreNocturne() {
    const coffre = document.getElementById("coffreNocturne");
    if (coffre) coffre.style.display = "block";
}

function hideCoffreNocturne() {
    const coffre = document.getElementById("coffreNocturne");
    if (coffre) coffre.style.display = "none";
}

function hideGameUI() {
    const hud = document.getElementById("gameHUD");
    const timerBar = document.getElementById("timerBarContainer");

    if (hud) hud.style.display = "none";
    if (timerBar) timerBar.style.display = "none";

    // On arrête le canvas du jeu
    Game.running = false;
}

function showGameUI() {
    const hud = document.getElementById("gameHUD");
    if (hud) hud.style.display = "block";
}

function showMainMenu() {
    playerName = localStorage.getItem("playerName") || "Invité";
    console.log("🏠 Retour propre au menu principal");

    hideGameUI();
    clearOrbs();
    Game.running = false;
    gameStarted = false;
    timerRunning = false;

    const canvas = document.getElementById("gameCanvas");
    if (canvas) canvas.style.display = "none";

    const menu = document.getElementById("mainMenu");
    if (menu) {
        menu.style.display = "block";
        menu.classList.remove("hidden");
    }

    showMenuMascotte();
    showMenuAnimations();
    initMenuCharacters();
    showEventBanner();
    updateHUD();

    setMascotteState("idle");
    startMascotteLoop();

    showMascotteDialog(
        mascotMenuLines[Math.floor(Math.random() * mascotMenuLines.length)],
        "happy"
    );

    document.body.classList.remove("normal-mode-active", "timer-mode-active", "campaign-mode-active");

    updateEtatCoffre();
    showCoffreNocturne();
    if (typeof window.syncHudVisibility === "function") window.syncHudVisibility();
}

function openGameModes() {
    document.getElementById("mainMenu")?.classList.add("hidden");
    document.getElementById("gameModePanel").classList.remove("hidden");
    if (typeof window.syncHudVisibility === "function") window.syncHudVisibility();
}

function closeGameModes() {
    document.getElementById("gameModePanel").classList.add("hidden");
    document.getElementById("gameModePanel").style.display = "none";

    const menu = document.getElementById("mainMenu");
    if (menu) {
        menu.style.display = "block";
        menu.classList.remove("hidden");
    }
    if (typeof window.syncHudVisibility === "function") window.syncHudVisibility();
}

function campaignComingSoon() {
    window.location.href = "pages/campaign.html";
}

function hideMainMenu() {
    const menu = document.getElementById("mainMenu");
    if (!menu) return;

    menu.classList.add("hidden");
    menu.style.display = "none";

    stopMenuMascotteAnimation = true;
    cancelAnimationFrame(updateMenuMascotteId);
}

function hideMenuMascotte() {
    const m = document.getElementById("menuMascotteContainer");
    if (m) m.style.display = "none";
}

function showMenuMascotte() {
    const m = document.getElementById("menuMascotteContainer");
    if (m) m.style.display = "block";
}

function isElementOpen(el) {
    if (!el) return false;
    if (el.classList.contains("hidden")) return false;
    return window.getComputedStyle(el).display !== "none";
}

function syncHudVisibility() {
    const hudContainer = document.getElementById("hudContainer");
    const quickButtons = document.getElementById("quickButtons");
    const optionsGear = document.getElementById("optionsGear");
    const campaignHud = document.getElementById("campaignHUD");
    const hudCombo = document.getElementById("hudCombo");
    const timerBarContainer = document.getElementById("timerBarContainer");

    const mainMenu = document.getElementById("mainMenu");
    const gameModePanel = document.getElementById("gameModePanel");
    const shopOverlay = document.getElementById("shopOverlay");
    const profileOverlay = document.getElementById("profileOverlay");
    const optionsOverlay = document.getElementById("optionsOverlay");

    const hasBlockingPanel =
        isElementOpen(mainMenu) ||
        isElementOpen(gameModePanel) ||
        isElementOpen(shopOverlay) ||
        isElementOpen(profileOverlay) ||
        isElementOpen(optionsOverlay);

    const isCampaignMode = currentMode === "campaign" && campaignMode && campaignMode.active;
    const isTimerMode = currentMode === "timer";

    const isRealGameRunning =
        !isGamePaused &&
        isGameRunning &&
        (isCampaignMode || Game.running) &&
        (gameStarted || timerRunning || isCampaignMode);

    const showGeneralHud = isRealGameRunning && !hasBlockingPanel;
    const showCampaignHud = showGeneralHud && isCampaignMode;
    const showComboHud = showGeneralHud && isTimerMode;
    const showTimerBar = showGeneralHud && isTimerMode;

    if (hudContainer) {
        hudContainer.style.display = showGeneralHud ? "block" : "none";
        hudContainer.style.opacity = showGeneralHud ? "1" : "0";
        hudContainer.style.pointerEvents = showGeneralHud ? "auto" : "none";
    }

    if (quickButtons) {
        quickButtons.style.display = showGeneralHud ? "flex" : "none";
        quickButtons.style.opacity = showGeneralHud ? "1" : "0";
        quickButtons.style.pointerEvents = showGeneralHud ? "auto" : "none";
    }

    if (optionsGear) {
        optionsGear.style.display = showGeneralHud ? "block" : "none";
        optionsGear.style.opacity = showGeneralHud ? "1" : "0";
        optionsGear.style.pointerEvents = showGeneralHud ? "auto" : "none";
    }

    if (campaignHud) {
        campaignHud.style.display = showCampaignHud ? "grid" : "none";
        campaignHud.style.opacity = showCampaignHud ? "1" : "0";
        campaignHud.style.pointerEvents = showCampaignHud ? "auto" : "none";
    }

    if (hudCombo) {
        hudCombo.style.display = showComboHud ? "block" : "none";
        hudCombo.style.opacity = showComboHud ? "1" : "0";
        hudCombo.style.pointerEvents = showComboHud ? "auto" : "none";
    }

    if (timerBarContainer) {
        timerBarContainer.style.display = showTimerBar ? "block" : "none";
        timerBarContainer.style.opacity = showTimerBar ? "1" : "0";
        timerBarContainer.style.pointerEvents = showTimerBar ? "auto" : "none";
    }
}

window.syncHudVisibility = syncHudVisibility;

function refreshComboHUDVisibility() {
    if (typeof window.syncHudVisibility === "function") {
        window.syncHudVisibility();
    }
}

function closeAllMenus() {
    document.getElementById("mainMenu")?.classList.add("hidden");
    document.getElementById("gameModePanel")?.classList.add("hidden");

    const menu = document.getElementById("mainMenu");
    if (menu) menu.style.display = "none";
    const panel = document.getElementById("gameModePanel");
    if (panel) panel.style.display = "none";
}

function startNormalMode() {
    setMascotteState("idle");

    resetGameValues();
    const canvas = document.getElementById("gameCanvas");
    if (canvas) canvas.style.display = "block";

    isGameRunning = true;
    isGamePaused = false;

    currentMode = "normal";
    document.body.classList.add("normal-mode-active");
    document.body.classList.remove("timer-mode-active", "campaign-mode-active");
    gameStarted = true;
    timerRunning = false;
    startSessionTimeTracking();
    refreshComboHUDVisibility();
    hideMainMenu();
    hideMenuMascotte();
    hideEventBanner();
    stopMenuBubble();
    stopMenuMascotte();
    closeAllMenus();
    showGameUI();
    hideCoffreNocturne();

    if (!musicInitialized) {
        initMusic();
    } else {
        playCurrentTrack();
    }

    missesMax = 15;
    level = 2;
    levelRewardGiven = false;
    levelTargetNormal = getNextLevelTarget(level);

    hideTimerBar();
    updateHUD();

    startGame(GameData);

    const saved = localStorage.getItem("equippedTheme");
    if (saved) {
        const bg = GameData.backgrounds.find(b => b.id === saved);
        if (bg) applyTheme(bg);
    }

    if (typeof window.syncHudVisibility === "function") window.syncHudVisibility();
}

function startTimerMode() {
    setMascotteState("idle");

    resetGameValues();
    const canvas = document.getElementById("gameCanvas");
    if (canvas) canvas.style.display = "block";

    isGameRunning = true;
    startSessionTimeTracking();
    hideEventBanner();
    hideMenuMascotte();
    stopMenuBubble();
    hideMainMenu();
    stopMenuMascotte();
    closeAllMenus();
    showGameUI();
    hideCoffreNocturne();

    if (typeof window.restoreFullscreen === "function") {
        window.restoreFullscreen();
    }

    if (!musicInitialized) {
        initMusic();
    } else {
        playCurrentTrack();
    }

    currentMode = "timer";
    document.body.classList.add("timer-mode-active");
    document.body.classList.remove("normal-mode-active", "campaign-mode-active");

    timerValue = 100;
    timerPressure = 1;
    spawnRate = 55;
    comboCount = 0;
    totalComboSuccess = 0;

    timerRunning = true;
    gameStarted = false;

    refreshComboHUDVisibility();

    showTimerBar();
    updateHUD();

    startGame(GameData);
    if (typeof window.syncHudVisibility === "function") window.syncHudVisibility();
}

// Expose menu and mode launch functions globally for inline HTML onclick handlers
window.openProfile = openProfile;
window.openGameModes = openGameModes;
window.closeGameModes = closeGameModes;
window.campaignComingSoon = campaignComingSoon;
window.startNormalMode = startNormalMode;
window.startTimerMode = startTimerMode;
window.showMainMenu = showMainMenu;
window.GameAssets = GameAssets;

// Fonction d'objectif de niveau utilisée par startNormalMode
function getNextLevelTarget(level) {
    if (level === 1) return 50;
    if (level === 2) return 100;
    if (level === 3) return 200;
    if (level === 4) return 400;
    if (level === 5) return 800;
    if (level === 6) return 1600;
    if (level === 7) return 2500;
    if (level === 8) return 4000;
    if (level === 9) return 6500;
    if (level === 10) return 10000;
    return Math.floor(10000 * Math.pow(1.2, level - 10));
}

// 📺 Pub récompensée — adaptateur
function showRewardedAd(onSuccess, onFail) {
    // 🔁 À REMPLACER par la vraie régie (AdMob / AdSense / autre)
    console.log("📺 Lancement pub récompensée…");

    // SIMULATION TEMPORAIRE (à supprimer quand la vraie pub est branchée)
    setTimeout(() => {
        const success = true; // passe à false pour tester l’échec
        if (success) {
            console.log("📺 Pub complétée");
            onSuccess();
        } else {
            console.warn("📺 Pub annulée");
            if (onFail) onFail();
        }
    }, 1200);
}



/* =========================================================
   🟣 MENU PAUSE — VERSION FINALE
   ========================================================= */

/* Bouton Pause (dans le HUD) */
const btnPause = document.getElementById("btnPause");
if (btnPause) {
    btnPause.onclick = () => openPause();
}

/* --- OUVRIR PAUSE --- */
function openPause() {
    const overlay = document.getElementById("pauseOverlay");
    if (!overlay) return;

    overlay.classList.remove("hidden");
    setTimeout(() => overlay.classList.add("visible"), 10);

    // Stop boucle & spawn
    isGamePaused = true;
    isGameRunning = false;
    Game.running = false;

    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
}

/* --- FERMER PAUSE / CONTINUER --- */
function closePause() {
console.log('Jeu en pause, sauvegarde de l\'état');

    savePlayerProfile();

    console.log('État du jeu sauvegardé :', gameState);

    const overlay = document.getElementById("pauseOverlay");
    if (!overlay) return;

    overlay.classList.remove("visible");
    setTimeout(() => overlay.classList.add("hidden"), 250);

    isGamePaused = false;
    isGameRunning = true;
    isGamePaused = false;
    Game.running = true;

    gameLoopId = requestAnimationFrame(render);

     
    
}


/* --- ALLER AU MENU PRINCIPAL --- */
function pauseToMenu() {
     

    playerName = localStorage.getItem("playerName") || "Invité";
    commitSessionPlayTime();
    savePlayerProfile();

    console.log('Jeu en pause, sauvegarde de l\'état');

    console.log('État du jeu sauvegardé :', gameState);

    const overlay = document.getElementById("pauseOverlay");
    if (!overlay) return;

    overlay.classList.remove("visible");
    overlay.classList.add("hidden");

    // Stop gameplay
    isGamePaused = false;
    isGameRunning = false;
    Game.running = false;

    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoopId = null;

    clearOrbs();          // supprime toutes les orbes
    hideGameUI();         // masque HUD

    // Masque le canvas de jeu
    const canvas = document.getElementById("gameCanvas");
    if (canvas) canvas.classList.add("hidden");

    // Mode campagne: retourner à campaign.html
    if (campaignMode && campaignMode.active) {
        setTimeout(() => {
            window.location.href = 'pages/campaign.html';
        }, 500);
    } else {
        // Mode normal: recharger
        setTimeout(() => {
            window.location.reload();
        }, 2500);

        returnToMainMenu();
        setTimeout(() => {
            resetGameValues();
            showMainMenu();
        }, 2500);
    }

    console.log("↩ Retour au menu principal depuis pause");
}

function confirmReturnToHub() {
    const ok = window.confirm("Quitter le jeu et revenir au centre de l'univers ?");
    if (!ok) return;

    commitSessionPlayTime();
    savePlayerProfile();

    const overlay = document.getElementById("pauseOverlay");
    if (overlay) {
        overlay.classList.remove("visible");
        overlay.classList.add("hidden");
    }

    if (campaignMode && campaignMode.active) {
        window.location.href = "pages/campaign.html";
    } else {
        window.location.href = "https://cjajlk.github.io/cjajlkGames-V2-test/v2/";
    }
}

// Afficher un indicateur de chargement avant de rafraîchir la page
function showLoadingScreen() {
    // Créer un div pour l'écran de chargement
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-screen'; // Ajoute une classe pour styliser l'écran de chargement
    loadingDiv.innerHTML = "Chargement...";

    // Créer l'image de chargement
    const loadingImage = document.createElement('img');
    loadingImage.src = 'assets/images/chargement/chargement.png';  // Le chemin vers ton image
    loadingImage.alt = "Chargement...";  // Texte alternatif pour l'image
    loadingDiv.appendChild(loadingImage);

    // Ajouter l'élément de chargement au body
    document.body.appendChild(loadingDiv);

    // Après un délai de 2.5s, rafraîchir la page
    setTimeout(() => {
        location.reload();  // Rafraîchir la page après 2.5 secondes
    }, 2500); // 2500 ms = 2.5 secondes
}

// Utilise cette fonction avant de quitter la partie ou au moment où tu veux montrer l'écran de chargement





/* =========================================================
   🌙 ANIMATION MASCOTTE (Idle + Blink dans le menu)
   ========================================================= */

// Lance les animations de la mascotte du menu
function showMenuAnimations() {
    const mascotte = document.getElementById("menuMascotteImg");
    if (!mascotte) return;

    const idleMasc = GameAssets.images["menu_mascotte_idle"];

    stopMenuMascotteAnimation = false;

    mascotte.style.display = "block";
    mascotte.src = idleMasc ? idleMasc.src : "assets/images/menu/lyra_idle.png";

    updateMenuMascotteId = requestAnimationFrame(updateMenuMascotte);
}

// Animation idle → blink
function updateMenuMascotte() {
    if (stopMenuMascotteAnimation) return;

    const mascotte = document.getElementById("menuMascotteImg");
    if (!mascotte) return;

    const idleMasc  = GameAssets.images["menu_mascotte_idle"];
    const blinkMasc = GameAssets.images["menu_mascotte_blink"];
   
    
    

    menuBlinkTimer++;

    if (menuBlinkTimer > 250 + Math.random() * 200) {

        if (blinkMasc) mascotte.src = blinkMasc.src;

        setTimeout(() => {
            if (!stopMenuMascotteAnimation) {
                mascotte.src = idleMasc ? idleMasc.src : "assets/images/menu/lyra_idle.png";
            }
        }, 4000);

        menuBlinkTimer = 0;
    }

    updateMenuMascotteId = requestAnimationFrame(updateMenuMascotte);
}

// Stop net de l’animation
function stopMenuMascotte() {
    stopMenuMascotteAnimation = true;

    if (updateMenuMascotteId) {
        cancelAnimationFrame(updateMenuMascotteId);
        updateMenuMascotteId = null;
    }
}


/* =========================================================
   ✨ PARTICULES / +1 / SHOCKWAVE
   ========================================================= */

   const ORB_COLORS = {
    orb_blue:   { base: "#4aa3ff", glow: "#8cc7ff" },
    orb_green:  { base: "#4aff7a", glow: "#8dffad" },
    orb_red:    { base: "#ff4a4a", glow: "#ff9a9a" },
    orb_yellow: { base: "#ffd84a", glow: "#ffef9a" },
    orb_violet: { base: "#b44aff", glow: "#d7a3ff" },
    orb_noel:   { base: "#ffcc66", glow: "#fff1c1" }
};



  function explodeOrb(orb) {
    const palette = ORB_COLORS[orb.orbId];

    const color = palette ? palette.base : "#ffffff";
    const glow  = palette ? palette.glow : color;

    spawnParticles(orb.x, orb.y, color, glow);
    spawnShockwave(orb.x, orb.y, glow);
}





function updateParticles(ctx) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;
        p.life--;

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 14;
        ctx.shadowColor = p.glow || p.color;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        if (p.life <= 0) particles.splice(i, 1);
    }
}




function spawnParticles(x, y, color, glow) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x,
            y,
            size: 4 + Math.random() * 4,
            angle: Math.random() * Math.PI * 2,
            speed: 2 + Math.random() * 3,
            life: 30,
            color,
            glow
        });
    }
}



function spawnFloatText(x, y, gain = 1) {
    floatTexts.push({
        x,
        y,
        text: "+" + gain,
        life: 40,
        big: gain > 1

    });
}





function updateFloatTexts(ctx) {
    for (let i = floatTexts.length - 1; i >= 0; i--) {
        const f = floatTexts[i];
        f.y -= 1;
        f.life--;

        ctx.font = f.big ? "bold 32px Poppins" : "28px Poppins";
        ctx.fillStyle = `rgba(255,255,255,${f.life / 40})`;
        ctx.fillText(f.text, f.x, f.y);

        if (f.life <= 0) floatTexts.splice(i, 1);
    }
}

function spawnShockwave(x, y, color) {
    shockwaves.push({
        x,
        y,
        radius: 10,
        life: 22,
        color: color || "#ffffff" // ✅ sécurité
    });
}

function updateShockwaves(ctx) {
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        const s = shockwaves[i];
        s.radius += 3;
        s.life--;

        const safeColor = s.color || "#ffffff"; // ✅ sécurité
        const { r, g, b } = hexToRgb(safeColor);

        ctx.strokeStyle = `rgba(${r},${g},${b},${s.life / 22})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.stroke();

        if (s.life <= 0) shockwaves.splice(i, 1);
    }
}

function hexToRgb(hex) {
    if (!hex) return "255,255,255"; // sécurité

    hex = hex.replace("#", "");
    const bigint = parseInt(hex, 16);

    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `${r},${g},${b}`;
}





// ---------------------------------------------------------
// 🔵 Efface toutes les orbes de la partie
// ---------------------------------------------------------
function clearOrbs() {

    // 1. Vider le tableau interne
    if (Array.isArray(targets)) {
        targets.length = 0;  // supprime instantanément toutes les orbes
    }

    // 2. Si jamais tu avais un container HTML (optionnel)
    const cont = document.getElementById("orbContainer");
    if (cont) cont.innerHTML = "";

    
}



/* =========================================================
   🧍 MASCOTTE VIVANTE
   ========================================================= */

function drawMascotte(ctx) {
    if (!Game.assets.mascotte) return;

    const baseSize = Math.min(Game.canvas.width, Game.canvas.height);
    let scale = 2;

// 🌟 bonus taille skins spéciales
if (equippedMascotte === "futuriste_defense") scale = 1.15;
if (equippedMascotte === "boss") scale = 1.3;

const h = baseSize * 0.20 * scale;
const w = h * 0.70;


    const x = Game.canvas.width * 0.10;
    const y = Game.canvas.height - h - 60;

    const t = Date.now() * 0.002;
    const bob = Math.sin(t) * 2;
    const sway = Math.sin(t * 0.6) * 1.5;

    // Ombre sol
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.ellipse(
        x + w * 0.5,
        Game.canvas.height - 40,
        w * 0.45,
        18,
        0, 0, Math.PI * 2
    );
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fill();
    ctx.restore();

    // Glow dynamique
    ctx.save();
    ctx.shadowColor = "rgba(150,120,255,0.35)";
    ctx.shadowBlur = 35 + Math.sin(t * 1.5) * 8;

    ctx.drawImage(
        Game.assets.mascotte,
        x + sway,
        y + bob,
        w,
        h
    );
    ctx.restore();
}

function addCoins(amount) {
    if (!amount || amount <= 0) return;

    coins += amount;
    savePlayerProfile();

    updateAllProfileUI();
    updateProfilePanel();
}


 function updateHUD() {
    // --- SCORE ---
    const hudPoints = document.getElementById("hudPoints");
    if (hudPoints) {
        hudPoints.textContent = "Pts : " + score;
        
    }

    // --- COINS ---
    const hudCoins = document.getElementById("profileCoins");
    if (hudCoins) {
        hudCoins.textContent = coins ?? 0;
    }

    // --- GEMS ---
    const hudGems = document.getElementById("profileGems");
    if (hudGems) {
        hudGems.textContent = gems ?? 0;
    }

    // --- XP BAR (VISUELLE) ---
const xpBarFill = document.getElementById("xpBarFill");
if (xpBarFill && xpToNext > 0) {
    const percent = Math.min(100, (playerXP / xpToNext) * 100);
    xpBarFill.style.width = `${percent}%`;
} else {
    console.warn("Erreur : xpToNext est invalide.");
}

// --- XP TEXT (AFFICHAGE UNIQUEMENT) ---
const xpText = document.getElementById("xpText");
if (xpText && xpToNext > 0) {
    const displayedXP = Math.min(playerXP, xpToNext);

    xpText.textContent =
        `Lvl ${playerLevel} – ${displayedXP} / ${xpToNext} XP`;

    // Message purement informatif (le niveau est déjà géré ailleurs)
    if (displayedXP >= xpToNext) {
        xpText.textContent += " (Niveau atteint !)";
    }
}

// --- COMBO ---
const hudCombo = document.getElementById("hudCombo");
if (hudCombo) {
    const isTimerMode = currentMode === "timer" && timerRunning;

    if (isTimerMode) {
        let html = `Combo : ${comboCount}/${comboTarget}`;

        if (comboGemBonus) {
            html += ` <span class="combo-gem">+1</span> 💎`;
        }

        hudCombo.innerHTML = html;
        hudCombo.style.display = "block";
        hudCombo.style.opacity = "1";

        // Animation douce
        hudCombo.classList.remove("combo-anim");
        void hudCombo.offsetWidth; // forcer reflow
        hudCombo.classList.add("combo-anim");
    }
}

if (campaignMode && campaignMode.active) {
    const campaignObjective = getCampaignObjective();
    if (!campaignTransitionInProgress && score >= campaignObjective) {
        endCampaignLevel();
    }
}

if (typeof window.syncHudVisibility === "function") {
    window.syncHudVisibility();
}

}


/* =========================================================
   🖱️ CLICK SUR LE JEU — VERSION FIXÉE
   ========================================================= */
function onGameClick(e) {
    if ((!gameStarted && !timerRunning) || inLevelTransition) return;
    if (isGamePaused) return;

    const rect = Game.canvas.getBoundingClientRect();
    const scaleX = Game.canvas.width / rect.width;
    const scaleY = Game.canvas.height / rect.height;

    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    let touched = false;

    for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];

        if (mx >= t.x && mx <= t.x + t.size &&
            my >= t.y && my <= t.y + t.size) {

            sfx_pop.currentTime = 0;
            sfx_pop.play().catch(() => {});

            let gain = 1;
            if (t.orbId === equippedOrb) {
                gain = timerRunning ? 1 : 2;
                if (timerRunning) {
                    timerValue = Math.min(100, timerValue + 10);
                }
            }

            if (equippedOrb === "orb_black_risk") {
                if (Math.random() < 0.2) {
                    if (timerRunning) {
                        timerValue = Math.max(0, timerValue - 5);
                    } else {
                        score = Math.max(0, score - 1);
                    }
                }
            }

            score += gain;
            playerTotalPoints += gain;

            checkAndDisplayObjective();
            checkTitlesUnlock();
            savePlayerProfile();

            const newLevel = getLevelFromTotalPoints(playerTotalPoints);
            const currentLevelStart = getPointsForLevel(newLevel);
            const nextLevelTarget = getPointsForLevel(newLevel + 1);

            playerXP = playerTotalPoints - currentLevelStart;
            xpToNext = nextLevelTarget - currentLevelStart;

            if (newLevel !== playerLevel) {
                playerLevel = newLevel;
                showLevelToast(playerLevel);
                showMascotteDialog(`Niveau ${playerLevel} atteint ✨`, "happy");
            }

            if (score > highScore) highScore = score;

            addXP(gain);

            if (timerRunning) {
                onHitSuccess(t.x + t.size / 2, t.y + t.size / 2, gain);
            }

            if (!timerRunning) {
                if (typeof window.addCoins === "function") {
                    addCoins(1);
                } else {
                    console.warn("⚠️ addCoins() manquant");
                }
            }

            const cx = t.x + t.size / 2;
            const cy = t.y + t.size / 2;
            spawnParticles(cx, cy);
            spawnFloatText(cx, cy, gain);
            spawnShockwave(cx, cy);

            targets.splice(i, 1);
            touched = true;
        }
    }

    if (touched) {
        updateHUD();
        checkProgressAfterHit();
        savePlayerProfile();
        console.log("⭐ Score :", score);
    }
}

function checkAndDisplayObjective() {
    const goalMultiplier = 1000;
    const maxGoal = 10;

    const objectives = [];
    for (let i = 1; i <= maxGoal; i++) {
        objectives.push({ points: goalMultiplier * i });
    }

    for (let i = 0; i < objectives.length; i++) {
        if (playerTotalPoints >= objectives[i].points && i > lastObjectiveIndex) {
            lastObjectiveIndex = i;
            spawnObjectiveText(`Objectif atteint : ${objectives[i].points} points ! 🎉`);
        }
    }
}

function spawnObjectiveText(text) {
    const textElement = document.createElement("div");
    textElement.classList.add("floating-text");
    textElement.textContent = text;
    document.body.appendChild(textElement);
    textElement.style.left = `${Game.canvas.width / 20}px`;
    textElement.style.top = `450px`;
    setTimeout(() => {
        document.body.removeChild(textElement);
    }, 2000);
}

/* =========================================================
   🎯 COMBO SYSTEM
   ========================================================= */
function onHitSuccess(cx, cy, gain) {
    comboCount++;

    if (comboCount >= comboTarget) {
        comboCount = 0;
        totalComboSuccess++;

        if (totalComboSuccess === 5 || totalComboSuccess === 10 || totalComboSuccess % 25 === 0) {
            showMascotteDialog("Incroyable !", "happy");
        }

        timerValue = Math.min(100, timerValue + 20);
        addXP(1);
        spawnFloatText(cx, cy, "COMBO !", "gold");
        spawnShockwave(cx, cy);
        showComboEffect(totalComboSuccess);
    }
}

function showComboEffect(mult) {
    const el = document.getElementById("comboEffect");
    if (!el) return;

    el.textContent = `COMBO x${mult}!`;
    el.classList.remove("combo-flash");
    void el.offsetWidth;
    el.classList.add("combo-flash");

    document.body.classList.remove("screen-shake");
    void document.body.offsetWidth;
    document.body.classList.add("screen-shake");

    setTimeout(() => {
        el.classList.remove("combo-flash");
        document.body.classList.remove("screen-shake");
    }, 300);
}

/* =========================================================
   🔄 BOUCLE DE RENDU
   ========================================================= */
function initRender() {
    if (!Game.running) {
        Game.running = true;
        lastFrameTime = 0;
        gameLoopId = requestAnimationFrame(render);
    }
}

function render() {
    if (!Game.running) return;

    const now = performance.now();
    const deltaMs = lastFrameTime ? (now - lastFrameTime) : 0;
    lastFrameTime = now;

    // The shared engine validates visibility, pause, ownership and frame duration.
    // Its accepted milliseconds are also the only source for the local time display.
    sessionActiveMs += window.CJEngine?.tick(deltaMs, 'attrape') || 0;

    const ctx = Game.ctx;
    if (!ctx) return;

    auraTime += 0.03;
    ctx.clearRect(0, 0, Game.canvas.width, Game.canvas.height);

    if (Game.assets.background) {
        ctx.drawImage(Game.assets.background, 0, 0, Game.canvas.width, Game.canvas.height);
    }

    if (timerRunning) {
        timerValue -= timerSpeed * timerPressure;
        timerBackgroundElapsed += timerSpeed;

        if (currentMode === "timer" && timerBackgroundElapsed >= TIMER_BG_INTERVAL) {
            timerBackgroundElapsed = 0;
            if (GameData.backgrounds && GameData.backgrounds.length > 0) {
                currentBackgroundIndex = (currentBackgroundIndex + 1) % GameData.backgrounds.length;
                transitionBackgroundCinematic(() => applyBackgroundFromIndex());
                if (typeof crossfadeToNextTrack === "function") crossfadeToNextTrack();
            }
        }

        const bar = document.getElementById("timerBar");
        if (bar) {
            const maxHeight = 200;
            const height = Math.max(0, (timerValue / 100) * maxHeight);
            bar.style.height = height + "px";
        }

        if (timerValue <= 0) {
            timerValue = 0;
            endTimerMode();
            return;
        }

        if (isGamePaused) return;
    }

    if (!isGamePaused && isGameRunning && (gameStarted || timerRunning) && !inLevelTransition) {
        spawnTimerMs += deltaMs;
        const spawnThresholdMs = (timerRunning ? spawnRate * 0.55 : spawnRate) * (1000 / 60);
        if (spawnTimerMs >= spawnThresholdMs) {
            spawnTimerMs = 0;
            spawnOrb();
        }
    }

    for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i];
        const isMobile = window.innerWidth < 820;

        if (isMobile) {
            t.x += (Math.random() * 1.6 - 0.8);
            t.y += (Math.random() * 1.6 - 0.8);
        } else {
            t.x += (Math.random() * 1.2 - 0.6);
            t.y += (Math.random() * 1.2 - 0.6);
        }

        t.x = Math.max(10, Math.min(Game.canvas.width - t.size - 10, t.x));
        t.y = Math.max(10, Math.min(Game.canvas.height - t.size - 10, t.y));

        drawOrb(t);

        if (typeof t.lifetime === "number") {
            t.lifetime--;
            if (t.lifetime <= 0) {
                targets.splice(i, 1);
                if (!timerRunning) {
                    misses++;
                    updateHUD();
                    if (misses >= missesMax) {
                        endgame();
                        return;
                    }
                }
            }
        }
    }

    updateParticles(ctx);
    updateShockwaves(ctx);
    updateFloatTexts(ctx);
    drawMascotte(ctx);

    if (Game.running) {
        gameLoopId = requestAnimationFrame(render);
    }
}

/* =========================================================
   🌟 PROGRESSION
   ========================================================= */
function checkProgressAfterHit() {
    if (timerRunning) {
        if (score > 0 && score % 10 === 0) {
            timerValue = Math.min(100, timerValue + 40);
            spawnRate = Math.max(25, spawnRate - 5);
        }
        updateHUD();
        return;
    }

    if (campaignMode && campaignMode.active) {
        updateHUD();
        const campaignObjective = getCampaignObjective();
        if (!campaignTransitionInProgress && score >= campaignObjective) {
            endCampaignLevel();
        }
        return;
    }

    if (levelRewardGiven) return;
    if (score >= levelTargetNormal) {
        levelRewardGiven = true;
        level++;
        levelTargetNormal = getNextLevelTarget(level);
        setTimeout(() => {
            levelRewardGiven = false;
        }, 100);

        if (GameData.backgrounds && GameData.backgrounds.length > 0) {
            currentBackgroundIndex = (currentBackgroundIndex + 1) % GameData.backgrounds.length;
            transitionBackgroundCinematic(() => applyBackgroundFromIndex());
            if (typeof crossfadeToNextTrack === "function") crossfadeToNextTrack();
        }

        misses = 0;
        spawnRate = Math.max(20, spawnRate - 5);
        updateHUD();
        showMascotteDialog(`Niveau ${level} termine !`, "happy");
    }
}

/* =========================================================
   ⏳ TIMER BAR
   ========================================================= */
function showTimerBar() {
    const c = document.getElementById("timerBarContainer");
    const bar = document.getElementById("timerBar");
    if (c) c.style.display = "block";
    if (bar) bar.style.height = "100%";
}

function hideTimerBar() {
    const c = document.getElementById("timerBarContainer");
    const bar = document.getElementById("timerBar");
    if (c) c.style.display = "none";
    if (bar) bar.style.height = "0px";
}

function updateTimerBar() {
    const timerBar = document.getElementById("timerBar");
    const timerBarContainer = document.getElementById("timerBarContainer");
    if (!timerBar || !timerBarContainer) return;

    if (timerRunning) timerPressure += 0.0035;

    const maxHeight = 220;
    const height = Math.max(0, (timerValue / 100) * maxHeight);
    timerBar.style.height = `${height}px`;

    const percentage = timerValue / 100;
    timerBar.style.background = `linear-gradient(0deg, #c278ff ${percentage * 100}%, #9f50ff)`;

    if (timerValue <= 0) {
        timerBar.style.height = "0px";
        timerValue = 0;
        endTimerMode();
    }
}

/* =========================================================
   🎄 BANNIERE EVENEMENT
   ========================================================= */
function showEventBanner() {
    const bottom = document.getElementById("menuBottomEffect");
    const banner = document.getElementById("eventBanner");
    const isActive = window.EventManager && EventManager.isEventActive("valentin");

    if (!isActive) {
        hideEventBanner();
        return;
    }

    if (bottom) bottom.style.opacity = "0";
    if (banner) banner.style.display = "flex";
    document.body.classList.add("event-valentin");
}

function hideEventBanner() {
    const bottom = document.getElementById("menuBottomEffect");
    const banner = document.getElementById("eventBanner");

    if (bottom) bottom.style.opacity = "0.6";
    if (banner) banner.style.display = "none";
    document.body.classList.remove("event-valentin");
}

/* =========================================================
   🔄 RESET / FIN DE PARTIE
   ========================================================= */
function resetGameValues() {
    score = 0;
    comboCount = 0;
    playerLevel = getLevelFromTotalPoints(playerTotalPoints);
    playerXP = 0;
    savePlayerProfile();
    updateHUD();
}

function returnToMainMenu() {
    commitSessionPlayTime();
    savePlayerProfile();
    isGameRunning = false;
    Game.running = false;
    gameStarted = false;
    timerRunning = false;

    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoopId = null;

    hideGameUI();
    clearOrbs();
    refreshComboHUDVisibility();
}

function endgame() {
    showMascotteDialog(mascotLoseLines[Math.floor(Math.random() * mascotLoseLines.length)], "sad");

    Game.running = false;
    gameStarted = false;
    timerRunning = false;

    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoopId = null;

    const elapsedSeconds = commitSessionPlayTime();

    if (score > 0) {
        playerTotalPoints += score;
        if (score > highScore) highScore = score;
        addXP(score);
        checkTitlesUnlock();
    }

    if (score > 0 || elapsedSeconds > 0) {
        savePlayerProfile();
    }

    setTimeout(() => {
        returnToMainMenu();
        showMainMenu();
    }, 2500);
}

function endTimerMode() {
    showMascotteDialog(mascotLoseLines[Math.floor(Math.random() * mascotLoseLines.length)], "sad");

    timerRunning = false;
    gameStarted = false;
    Game.running = false;

    const elapsedSeconds = commitSessionPlayTime();

    if (score > 0) {
        playerTotalPoints += score;
        if (score > highScore) highScore = score;
        checkTitlesUnlock();
        addXP(score);
    }

    if (score > 0 || elapsedSeconds > 0) {
        savePlayerProfile();
    }

    setTimeout(() => {
        resetGameValues();
        showMainMenu();
    }, 2500);
}

function quitToMenu() {
    commitSessionPlayTime();
    savePlayerProfile();
    isGamePaused = false;
    isGameRunning = false;
    Game.running = false;

    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoopId = null;

    if (typeof window.syncHudVisibility === "function") window.syncHudVisibility();

    setTimeout(() => {
        window.location.reload();
    }, 2500);
}

/* =========================================================
   📈 NIVEAUX / XP
   ========================================================= */
function getPointsForLevel(level) {
    if (level <= 1) return 0;
    const base = 300;
    const growth = 1.7;
    return Math.floor(base * Math.pow(level - 1, growth));
}

function getLevelFromTotalPoints(totalPoints) {
    let lvl = 1;
    while (lvl < SEASON_MAX_LEVEL && totalPoints >= getPointsForLevel(lvl + 1)) {
        lvl++;
    }
    return lvl;
}

function updatePlayerBadge() {
    const badge = document.getElementById("playerBadge");
    if (!badge) return;

    if (!playerName && !equippedTitle) {
        badge.classList.add("hidden");
        return;
    }

    let titleText = equippedTitle
        ? (PlayerTitles.find(t => t.id === equippedTitle)?.name ?? "Aucun titre")
        : "Aucun titre";

    badge.textContent = `${playerName} - ${titleText}`;
    badge.classList.remove("hidden");
    setTimeout(() => badge.classList.add("visible"), 10);
}

