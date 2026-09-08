/**
 * 🎮 CJEngine.js - MOTEUR OFFICIEL D'ACCUMULATION CJ
 * ⚠️ ÉLÉMENT CRITIQUE DE L'ÉCOSYSTÈME
 * 
 * Gère automatiquement l'accumulation de CJ basée sur le temps de jeu ACTIF
 * 
 * Avantages :
 * ✅ Un seul moteur pour tous les jeux
 * ✅ Protection anti-farming (visibilité + jeu actif)
 * ✅ Sauvegarde dans localStorage
 * ✅ Synchronisation entre onglets
 * ✅ Intégré avec cjAccount.js (source de vérité)
 */

// 1️⃣ Version marker: preserve all existing partial CJ progress.
const CJ_ENGINE_VERSION = "2026.02.19";
function checkEngineVersion() {
    // A code update must never erase earned partial progress.
    try { if (!localStorage.getItem('CJEngine_version')) localStorage.setItem('CJEngine_version', CJ_ENGINE_VERSION); } catch {}
}
checkEngineVersion();

// 2️⃣ Protection anti double initialisation
if (window.__CJ_ENGINE_INITIALIZED__) {
    console.warn("CJEngine déjà initialisé → arrêt");
} else {
    window.__CJ_ENGINE_INITIALIZED__ = true;

const CJEngine = (function () {
    "use strict";

    // ═══════════════════════════════════════════════════════════════════════════
    // 3️⃣ Auto-correction timer bloqué (dans la boucle moteur, à intégrer dans le tick principal)
    // À placer dans la boucle principale/tick du moteur (exemple générique)
    // if (!state.engineActive && Date.now() - state.lastTick > 5000) {
    //   warn("⚠ Timer incohérent détecté → réactivation");
    //   state.engineActive = true;
    // }
    // 🔧 CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════

    const CONFIG = {
        CJ_EARN_MS: 600000,      // ⏱️ 10 minutes = +1 CJ (production)
        DEBUG: false,             // Logs console désactivés par défaut
        ANIMATION_DURATION: 1200,  // Durée popup (ms)
        MAX_FRAME_DELTA: 200,      // 🔒 Protection anti delta hack (ms)
        TEST_CJ_POPUP: true        // 🧪 TEMP (2 jours) : notif +1 CJ universel
    };

    // Activer debug si window.CJ_DEBUG === true
    if (window.CJ_DEBUG === true) {
        CONFIG.DEBUG = true;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 ÉTAT INTERNE
    // ═══════════════════════════════════════════════════════════════════════════

    let state = {
        timers: {},          // {gameName: activeMs}
        debugEl: null,
        cjPopupCount: 0,
        engineActive: false, // 🔒 Protection anti multi-onglet
        testPopupActive: false,
        lockPending: false, releaseLock: null, lastSample: null, initialized: false, storageError: false
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 💾 LOCALSTORAGE
    // ═══════════════════════════════════════════════════════════════════════════

    function loadTimersFromStorage() {
        try {
            const saved = localStorage.getItem("cjEngineTimers");
            if (saved) {
                state.timers = JSON.parse(saved);
                debug(`📂 Timers chargés: ${JSON.stringify(state.timers)}`);
            }
        } catch (e) {
            warn(`Erreur lecture cjEngineTimers: ${e.message}`);
        }
    }

    function saveTimersToStorage() {
        try {
            localStorage.setItem("cjEngineTimers", JSON.stringify(state.timers));
        } catch (e) {
            warn(`Erreur sauvegarde cjEngineTimers: ${e.message}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🛠️ UTILITAIRES
    // ═══════════════════════════════════════════════════════════════════════════

    function debug(message) {
        if (!CONFIG.DEBUG) return;
        console.log(`[CJEngine] ${message}`);
    }

    function warn(message) {
        console.warn(`[CJEngine] ⚠️ ${message}`);
    }

    function ensureDebugEl() {
        if (!CONFIG.DEBUG || state.debugEl) return;
        state.debugEl = document.createElement("div");
        state.debugEl.id = "cjEngineDebug";
        state.debugEl.style.position = "fixed";
        state.debugEl.style.left = "10px";
        state.debugEl.style.bottom = "10px";
        state.debugEl.style.zIndex = "9999";
        state.debugEl.style.padding = "6px 8px";
        state.debugEl.style.borderRadius = "6px";
        state.debugEl.style.background = "rgba(0,0,0,0.8)";
        state.debugEl.style.color = "#0f0";
        state.debugEl.style.font = "11px/1.4 monospace";
        state.debugEl.style.pointerEvents = "none";
        state.debugEl.style.maxWidth = "300px";
        document.body.appendChild(state.debugEl);
    }

    function removeDebugEl() {
        if (!state.debugEl) return;
        state.debugEl.remove();
        state.debugEl = null;
    }

    function updateDebug(gameName) {
        if (!CONFIG.DEBUG) {
            removeDebugEl();
            return;
        }
        ensureDebugEl();
        const activeMs = state.timers[gameName] || 0;
        const remainingMs = Math.max(0, CONFIG.CJ_EARN_MS - activeMs);
        state.debugEl.textContent =
            `[CJEngine] ${gameName}\nactive: ${Math.floor(activeMs)}ms\nremaining: ${Math.floor(remainingMs)}ms`;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎮 VÉRIFICATION D'ÉTAT DE JEU
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Fonction de callback fournie par le jeu
     * Doit retourner {running: Boolean}
     */
    function getGameState() {
        if (typeof window.getGameState !== "function") {
            return { running: false };
        }
        return window.getGameState();
    }

    /**
     * Vérifie si une session est VRAIMENT active
     * (onglet visible ET jeu en cours)
     */
    function isActiveSession() {
        try {
            const game = getGameState();
            return document.visibilityState === 'visible' && document.hasFocus() && !!game.running && !game.paused;
        } catch { return false; }
    }

    function suspend() {
        state.lastSample = null;
        state.engineActive = false;
        if (state.releaseLock) { const release = state.releaseLock; state.releaseLock = null; release(); }
    }

    function acquireSession() {
        if (state.engineActive || state.lockPending || !isActiveSession() || !navigator.locks?.request) return;
        state.lockPending = true;
        // Shared with V2 purchases/equipment. Released as soon as gameplay loses focus,
        // pauses or exits. No expiring localStorage lease and no stale timer snapshot.
        navigator.locks.request('cjajlk-v2-account-write', { ifAvailable: true }, lock => {
            if (!lock || !isActiveSession()) return;
            state.engineActive = true;
            state.lastSample = null;
            return new Promise(resolve => { state.releaseLock = resolve; });
        }).catch(() => { state.storageError = true; }).finally(() => { state.lockPending = false; });
    }

    const record = value => value && typeof value === 'object' && !Array.isArray(value);
    const validMs = (value, limit) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value < limit;
    function readProgress(player, gameName) {
        const ledger = player?.cjActivityV1;
        if (ledger !== undefined && (!record(ledger) || ledger.version !== 1 || !record(ledger.games))) throw new Error('Invalid activity ledger');
        const saved = ledger?.games?.[gameName];
        if (saved !== undefined) {
            if (!record(saved) || !validMs(saved.cjMs, CONFIG.CJ_EARN_MS) || !validMs(saved.timeMs, 1000)) throw new Error('Invalid activity progress');
            return saved;
        }
        let legacy = {};
        try { legacy = JSON.parse(localStorage.getItem('cjEngineTimers') || '{}'); } catch {}
        const remainder = legacy?.[gameName];
        return { cjMs: validMs(remainder, CONFIG.CJ_EARN_MS) ? remainder : 0, timeMs: 0 };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 💰 GESTION DES RÉCOMPENSES CJ
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Récompense les CJ gagnés
     * Intègre avec cjAccount.js (source de vérité)
     */
    function rewardCJ(gameName, amount) {
        if (!gameName || amount <= 0) {
            warn(`rewardCJ: paramètres invalides (${gameName}, ${amount})`);
            return;
        }

        // ✅ SYNCHRONISER AVEC cjAccount.js
        if (window.cjAccount && typeof window.cjAccount.addCJ === "function") {
            window.cjAccount.addCJ(gameName, amount);
            debug(`✅ ${gameName} +${amount} CJ → cjAccount.js`);
        } else if (window.CJajlkAccount && typeof window.CJajlkAccount.add === "function") {
            // Fallback sur ancien alias
            window.CJajlkAccount.add(gameName, amount);
            debug(`✅ ${gameName} +${amount} CJ → CJajlkAccount (fallback)`);
        } else {
            warn(`cjAccount.js non disponible pour ${gameName}`);
        }

        // 🧪 Notification temporaire +1 CJ universel (2 jours)
        showCJTestNotification();
    }

    function ensureTestPopupStyles() {
        if (document.getElementById("cjTestPopupStyles")) return;
        const style = document.createElement("style");
        style.id = "cjTestPopupStyles";
        style.textContent = "\
.cj-test-popup{\
position:fixed;\
right:20px;\
bottom:90px;\
z-index:10000;\
padding:12px 18px;\
border-radius:12px;\
background:rgba(25,15,55,0.85);\
border:1px solid rgba(170,140,255,0.5);\
color:#f2eaff;\
font-weight:700;\
font-size:1rem;\
text-shadow:0 0 12px rgba(180,140,255,0.6);\
box-shadow:0 0 20px rgba(120,90,255,0.4);\
animation:cjTestFade 1.4s ease-out forwards;\
}\
@keyframes cjTestFade{\
0%{opacity:0;transform:translateY(12px);}\
20%{opacity:1;}\
100%{opacity:0;transform:translateY(-14px);}\
}\
";
        document.head.appendChild(style);
    }

    function showCJTestNotification() {
        if (!CONFIG.TEST_CJ_POPUP) return;
        if (state.testPopupActive) return;
        state.testPopupActive = true;

        ensureTestPopupStyles();
        const el = document.createElement("div");
        el.className = "cj-test-popup";
        el.textContent = "✨ +1 CJ universel";
        document.body.appendChild(el);

        setTimeout(() => {
            el.remove();
            state.testPopupActive = false;
        }, CONFIG.ANIMATION_DURATION);
    }

    function showCJPopup(amount) {
        const el = document.createElement("div");
        el.className = "cj-popup";
        el.textContent = "+" + amount + " CJ";
        el.style.position = "fixed";
        el.style.right = "20px";
        el.style.color = "#0f0";
        el.style.fontWeight = "bold";
        el.style.zIndex = "10000";

        const offset = Math.min(state.cjPopupCount, 5) * 22;
        el.style.bottom = (80 + offset) + "px";
        state.cjPopupCount += 1;

        document.body.appendChild(el);

        setTimeout(() => {
            el.remove();
            state.cjPopupCount = Math.max(0, state.cjPopupCount - 1);
        }, CONFIG.ANIMATION_DURATION);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ⏱️ SYSTÈME DE TICK
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Accumule le temps de jeu actif
     * Appelé par le jeu à chaque frame avec deltaMs
     */
    function tick(deltaMs, gameName) {
        if (!isActiveSession()) { suspend(); return 0; }
        if (!state.engineActive) { acquireSession(); return 0; }
        const now = performance.now();
        const previous = state.lastSample;
        state.lastSample = now;
        // The first frame after activation, focus or pause establishes a new baseline.
        // Never trust a clamped game delta to represent a long hidden-tab interval.
        const wallDelta = previous === null ? 0 : now - previous;
        if (typeof deltaMs !== 'number' || !Number.isFinite(deltaMs) || deltaMs <= 0 || deltaMs > CONFIG.MAX_FRAME_DELTA || wallDelta <= 0 || wallDelta > CONFIG.MAX_FRAME_DELTA) return 0;
        if (typeof gameName !== 'string' || !/^[a-z][a-z0-9_-]*$/.test(gameName)) return 0;
        const acceptedMs = Math.min(deltaMs, wallDelta);
        try {
            const api = window.CJajlkAccount;
            if (!api || typeof api.addCJ !== 'function' || typeof api.addPlayTime !== 'function') return 0;
            const player = api.getPlayer();
            if (!record(player) || !record(player.stats) || !Number.isFinite(player.stats.totalCJ) || !record(player.stats.byGame) || !record(player.stats.playTime) || !record(player.stats.playTime.byGame)) return 0;
            const original = JSON.stringify(player);
            const progress = readProgress(player, gameName);
            const cjMs = progress.cjMs + acceptedMs, timeMs = progress.timeMs + acceptedMs;
            const earned = Math.floor(cjMs / CONFIG.CJ_EARN_MS), seconds = Math.floor(timeMs / 1000);
            // Reuse the account's existing award/time methods on a staged snapshot.
            // Commit seconds, reward and both fractional remainders atomically.
            const draft = Object.create(api);
            draft.ensureDataStructure = () => player;
            draft.getPlayer = () => player;
            draft.savePlayer = () => {};
            draft._lastCJCredit = {};
            if (earned && api.addCJ.call(draft, gameName, earned) !== true) return 0;
            if (seconds && api.addPlayTime.call(draft, gameName, seconds) !== true) return 0;
            player.cjActivityV1 = { ...player.cjActivityV1, version: 1, games: { ...player.cjActivityV1?.games, [gameName]: { ...progress, cjMs: cjMs % CONFIG.CJ_EARN_MS, timeMs: timeMs % 1000 } } };
            if (JSON.stringify(api.getPlayer()) !== original) return 0;
            api.savePlayer(player);
            if (JSON.stringify(api.getPlayer()) !== JSON.stringify(player)) { state.storageError = true; return 0; }
            state.storageError = false;
            state.timers[gameName] = cjMs % CONFIG.CJ_EARN_MS;
            if (earned) showCJTestNotification();
            updateDebug(gameName);
            return acceptedMs;
        } catch { state.storageError = true; return 0; }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔄 GESTION DU CYCLE DE VIE
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        if (state.initialized) return;
        state.initialized = true;
        loadTimersFromStorage();
        const boundary = () => { suspend(); if (isActiveSession()) acquireSession(); };
        document.addEventListener('visibilitychange', boundary);
        window.addEventListener('blur', suspend);
        window.addEventListener('focus', boundary);
        window.addEventListener('pagehide', suspend);
        window.addEventListener('pageshow', boundary);
        window.addEventListener('beforeunload', suspend);
        // Games which stop their rendering loop in menus must still release ownership.
        setInterval(() => { if (!isActiveSession()) suspend(); else acquireSession(); }, 100);
        acquireSession();
    }

    function reset(gameName) {
        if (!state.engineActive || !gameName) return false;
        const api = window.CJajlkAccount, player = api?.getPlayer();
        if (!player) return false;
        const progress = readProgress(player, gameName);
        player.cjActivityV1 = { ...player.cjActivityV1, version: 1, games: { ...player.cjActivityV1?.games, [gameName]: { ...progress, cjMs: 0 } } };
        api.savePlayer(player);
        state.timers[gameName] = 0;
        return true;
    }

    function resetAll() {
        if (!state.engineActive) return false;
        const player = window.CJajlkAccount?.getPlayer();
        for (const game of new Set([...Object.keys(state.timers), ...Object.keys(player?.cjActivityV1?.games || {})])) reset(game);
        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 STATISTIQUES
    // ═══════════════════════════════════════════════════════════════════════════

    function getStats(gameName) {
        if (!gameName) {
            warn("getStats: gameName manquant");
            return null;
        }

        let activeMs = 0;
        try { activeMs = readProgress(window.CJajlkAccount?.getPlayer(), gameName).cjMs; } catch {}
        state.timers[gameName] = activeMs;
        const remainingMs = Math.max(0, CONFIG.CJ_EARN_MS - activeMs);
        const progressPercent = (activeMs / CONFIG.CJ_EARN_MS) * 100;

        return {
            gameName,
            activeMs: Math.floor(activeMs),
            remainingMs: Math.floor(remainingMs),
            progressPercent: Math.floor(progressPercent),
            nextCJIn: Math.ceil(remainingMs / 1000) + "s"
        };
    }

    function getAllStats() {
        const stats = {};
        for (const gameName in state.timers) {
            stats[gameName] = getStats(gameName);
        }
        return stats;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎯 API PUBLIQUE
    // ═══════════════════════════════════════════════════════════════════════════

    return {
        // Cycle de vie
        init,
        reset,
        resetAll,

        // Tick et session
        tick,
        isActiveSession,
        suspend,
        tracksPlayTime: true,
        isTracking: () => state.engineActive,

        // Statistiques
        getStats,
        getAllStats,

        // Debug
        setDebug: (enabled) => {
            CONFIG.DEBUG = enabled;
            if (enabled) {
                debug("🔍 Debug mode ACTIVÉ");
            } else {
                removeDebugEl();
            }
        },

        // Config
        getConfig: () => ({ ...CONFIG })
    };
})();

// ═══════════════════════════════════════════════════════════════════════════
// 🌍 EXPOSITION GLOBALE
// ═══════════════════════════════════════════════════════════════════════════

window.CJEngine = CJEngine;

// Initialiser automatiquement
if (typeof CJEngine.init === "function") {
    CJEngine.init();
}

console.log("✅ CJEngine.js chargé et actif");
}
