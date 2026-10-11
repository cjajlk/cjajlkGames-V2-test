/* Local identity V1: one existing wallet, additive compatibility, no server identity. */
let cjIdentityReady = false;
const cjRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const cjNonnegative = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
function cjPrepare(raw) {
    const player = JSON.parse(raw);
    if (!cjRecord(player)) throw new Error('invalid-account');
    const absent = (object, key, value) => { if (object[key] === undefined) object[key] = value; };
    absent(player, 'schemaVersion', 2);
    if (player.id === undefined) player.id = cjAccount.generateId();
    if (typeof player.id !== 'string' || !player.id.trim()) throw new Error('invalid-id');
    absent(player, 'pseudo', 'Joueur');
    if (typeof player.pseudo !== 'string') throw new Error('invalid-pseudo');
    absent(player, 'createdAt', Date.now());
    absent(player, 'stats', {});
    if (!cjRecord(player.stats)) throw new Error('invalid-stats');
    absent(player.stats, 'totalCJ', 0);
    absent(player.stats, 'byGame', {});
    absent(player.stats, 'playTime', {});
    if (!cjNonnegative(player.stats.totalCJ) || !cjRecord(player.stats.byGame) || !cjRecord(player.stats.playTime)) throw new Error('invalid-stats');
    absent(player.stats.playTime, 'totalSeconds', 0);
    absent(player.stats.playTime, 'byGame', {});
    if (!cjNonnegative(player.stats.playTime.totalSeconds) || !cjRecord(player.stats.playTime.byGame)) throw new Error('invalid-time');
    for (const map of [player.stats.byGame, player.stats.playTime.byGame]) {
        if (!Object.values(map).every(cjNonnegative)) throw new Error('invalid-game-stats');
        absent(map, 'attrape', 0); absent(map, 'breaker', 0);
    }
    absent(player, 'items', {});
    if (!cjRecord(player.items)) throw new Error('invalid-items');
    absent(player.items, 'unlockedBadges', {}); absent(player.items, 'unlockedCosmetics', {});
    if (!cjRecord(player.items.unlockedBadges) || !cjRecord(player.items.unlockedCosmetics)) throw new Error('invalid-items');
    absent(player, 'preferences', { language: 'fr', volume: true });
    absent(player, 'selectedBadge', null);
    return player;
}
async function cjLocked(change) {
    if (typeof globalThis.navigator?.locks?.request !== 'function') return { ok: false, code: 'unsupported' };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try { return await navigator.locks.request('cjajlk-v2-account-write', { signal: controller.signal }, change); }
    catch (error) { return { ok: false, code: error?.name === 'AbortError' ? 'busy' : 'storage' }; }
    finally { clearTimeout(timeout); }
}
function cjAccountEvent(name) { window.dispatchEvent(new Event(name)); }

const cjAccount = {
    /**
     * Retourne le pseudo du joueur
     */
    getPseudo() {
        const playerData = this.getPlayer();
        return playerData?.pseudo || "";
    },
    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 INITIALISATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    init() { return this.initialize(); },

    async initialize() {
        cjIdentityReady = false;
        try {
            const original = localStorage.getItem('cjPlayerData');
            if (original !== null) {
                const prepared = cjPrepare(original);
                if (JSON.stringify(prepared) === JSON.stringify(JSON.parse(original))) {
                    cjIdentityReady = true;
                    cjAccountEvent('cj-account-ready');
                    return { ok: true, created: false, player: prepared };
                }
            }
        } catch { cjIdentityReady = false; return { ok: false, code: 'invalid-or-unavailable' }; }
        // Reread under the same lock as the engine and Hub transactions.
        return cjLocked(() => {
            try {
                const original = localStorage.getItem('cjPlayerData');
                const player = cjPrepare(original === null ? '{}' : original);
                const serialized = JSON.stringify(player);
                // Never overwrite an unreadable existing account or another writer.
                if (localStorage.getItem('cjPlayerData') !== original) return { ok: false, code: 'conflict' };
                if (original === null || serialized !== JSON.stringify(JSON.parse(original))) {
                    localStorage.setItem('cjPlayerData', serialized);
                    if (localStorage.getItem('cjPlayerData') !== serialized) return { ok: false, code: 'storage' };
                }
                cjIdentityReady = true;
                cjAccountEvent('cj-account-ready');
                cjAccountEvent('cj-account-updated');
                return { ok: true, created: original === null, player };
            } catch { return { ok: false, code: 'invalid-or-unavailable' }; }
        });
    },

    ensureDataStructure() {
        // Creation/migration is asynchronous and locked; legacy synchronous writers
        // may only use a readable existing profile. Never erase damaged storage.
        const raw = localStorage.getItem('cjPlayerData');
        if (raw === null) throw new Error('account-not-ready');
        return cjPrepare(raw);
    },

    isIdentityReady() { return cjIdentityReady; },

    getDisplayPseudo(fallback = 'Joueur') {
        const player = this.getPlayer();
        return typeof player?.pseudo === 'string' && player.pseudo.trim() ? player.pseudo : fallback;
    },

    async updatePseudo(value) {
        if (typeof value !== 'string') return { ok: false, code: 'invalid' };
        const pseudo = value.trim().replace(/\s+/g, ' ');
        if ([...pseudo].length < 2 || [...pseudo].length > 24 || /[<>\p{C}]/u.test(pseudo)) return { ok: false, code: 'invalid' };
        const ready = await this.initialize();
        if (!ready.ok) return ready;
        return cjLocked(() => {
            try {
                const original = localStorage.getItem('cjPlayerData');
                if (original === null) return { ok: false, code: 'account' };
                const player = cjPrepare(original);
                player.pseudo = pseudo;
                if (localStorage.getItem('cjPlayerData') !== original) return { ok: false, code: 'conflict' };
                const serialized = JSON.stringify(player);
                localStorage.setItem('cjPlayerData', serialized);
                if (localStorage.getItem('cjPlayerData') !== serialized) return { ok: false, code: 'storage' };
                cjAccountEvent('cj-account-updated');
                return { ok: true, pseudo };
            } catch { return { ok: false, code: 'storage' }; }
        });
    },

    /**
     * Sauvegarde les données du joueur
     */
    savePlayer(playerData) {
        try {
            localStorage.setItem("cjPlayerData", JSON.stringify(playerData));
            console.log("[cjAccount] 💾 Joueur sauvegardé dans cjPlayerData");
        } catch (e) {
            console.error("[cjAccount] ❌ Erreur sauvegarde localStorage:", e);
        }
    },

    /**
     * Charge les données du joueur
     */
    getPlayer() {
        try {
            const raw = localStorage.getItem("cjPlayerData");
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            console.error("[cjAccount] ❌ Erreur lecture localStorage:", e);
            return null;
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 💰 GESTION DES CJ
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Ajoute des CJ au compte (appelé par cjEngine)
     */
    addCJ(gameName, amount) {
        // Sécurité : refuser toute valeur non numérique, négative, NaN, undefined
        if (!gameName || typeof amount !== "number" || !isFinite(amount) || isNaN(amount) || amount <= 0) {
            // Protection silencieuse : ne rien faire
            return false;
        }

        // Anti double crédit rapide (anti-spam) : mémorise le dernier crédit par jeu
        if (!this._lastCJCredit) this._lastCJCredit = {};
        const now = Date.now();
        const last = this._lastCJCredit[gameName] || 0;
        // Refuse si moins de 300ms entre deux crédits pour le même jeu
        if (now - last < 300) {
            return false;
        }
        this._lastCJCredit[gameName] = now;

        const playerData = this.ensureDataStructure();

        // Ajouter au jeu spécifique
        playerData.stats.byGame[gameName] = (playerData.stats.byGame[gameName] || 0) + amount;

        // Ajouter au total global
        playerData.stats.totalCJ = (playerData.stats.totalCJ || 0) + amount;

        // Sauvegarder
        this.savePlayer(playerData);

        // Log (silencieux si besoin)
        // console.log(`[cjAccount] 💰 ${gameName} +${amount} CJ | Total global: ${playerData.stats.totalCJ} CJ`);
        return true;
    },

    /**
     * Décrémente uniquement le solde CJ global
     */
    spendCJ(amount) {
        if (typeof amount !== "number" || !isFinite(amount) || amount <= 0) {
            return false;
        }

        const normalizedAmount = Math.floor(amount);
        if (normalizedAmount <= 0) {
            return false;
        }

        const playerData = this.ensureDataStructure();
        if (playerData.stats.totalCJ < normalizedAmount) {
            return false;
        }

        playerData.stats.totalCJ -= normalizedAmount;
        this.savePlayer(playerData);
        return true;
    },

    /**
     * Compatibilité : conserve la signature historique
     */
    removeCJ(gameName, amount) {
        return this.spendCJ(amount);
    },

    // Compatibility alias. Identity changes are presented only in the Hub V2.
    setPseudo(newPseudo) { return this.updatePseudo(newPseudo); },
      
     setSelectedBadge(badgeId) {
    const playerData = this.ensureDataStructure();

    if (!playerData.items.unlockedBadges?.[badgeId]) {
        return false;
    }

    playerData.selectedBadge = badgeId;
    this.savePlayer(playerData);
    return true;
},  

    getSelectedBadge() {
    const playerData = this.getPlayer();
    return playerData?.selectedBadge || null;
},
    /**
     * Retourne le total CJ global
     */
    getTotalCJ() {
        const playerData = this.getPlayer();
        return playerData?.stats?.totalCJ || 0;
    },

    /**
     * Retourne les CJ gagnés par un jeu spécifique
     */
    getCJByGame(gameName) {
        const playerData = this.getPlayer();
        return playerData?.stats?.byGame?.[gameName] || 0;
    },

    /**
     * Retourne tous les CJ par jeu
     */
    getAllCJStats() {
        const playerData = this.getPlayer();
        return playerData?.stats?.byGame || {};
    },

    /**
     * Ajoute du temps de jeu global (en secondes)
     */
    addPlayTime(gameName, seconds) {
        if (!gameName || typeof seconds !== "number" || !isFinite(seconds) || seconds <= 0) {
            return false;
        }

        const normalizedSeconds = Math.floor(seconds);
        if (normalizedSeconds <= 0) {
            return false;
        }

        const playerData = this.ensureDataStructure();
        const playTime = playerData.stats.playTime;

        playTime.totalSeconds = (playTime.totalSeconds || 0) + normalizedSeconds;
        playTime.byGame[gameName] = (playTime.byGame[gameName] || 0) + normalizedSeconds;

        this.savePlayer(playerData);
        return true;
    },

    /**
     * Retourne le temps de jeu global total (secondes)
     */
    getTotalPlayTime() {
        const playerData = this.getPlayer();
        return playerData?.stats?.playTime?.totalSeconds || 0;
    },

    /**
     * Retourne le temps de jeu global d'un jeu (secondes)
     */
    getPlayTimeByGame(gameName) {
        const playerData = this.getPlayer();
        return playerData?.stats?.playTime?.byGame?.[gameName] || 0;
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎫 GESTION DES ITEMS ACHETÉS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Enregistre un badge acheté
     */
    unlockBadge(badgeId) {
        const playerData = this.ensureDataStructure();
        playerData.items.unlockedBadges[badgeId] = {
            unlockedAt: Date.now(),
            price: null // Will be set if cost info available
        };
        this.savePlayer(playerData);
        console.log(`[cjAccount] 🏆 Badge '${badgeId}' débloqué`);
    },

    /**
     * Vérifie si un badge est débloqué
     */
    isBadgeUnlocked(badgeId) {
        const playerData = this.getPlayer();
        return !!playerData?.items?.unlockedBadges?.[badgeId];
    },

    /**
     * Retourne tous les badges débloqués
     */
    getUnlockedBadges() {
        const playerData = this.getPlayer();
        return playerData?.items?.unlockedBadges || {};
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // 🦾 UTILITAIRES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Génère un ID unique
     */
    generateId() {
        if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    },

    /**
     * Authentifie le joueur avec un pseudo
     */
    // Historical alias only: does not authenticate a local player.
    authenticate(pseudo) { return this.updatePseudo(pseudo); },

    /**
     * Réinitialise complètement le compte (DEV ONLY)
     */
    reset() {
        localStorage.removeItem("cjPlayerData");
        localStorage.removeItem("cjEngineTimers"); // Aussi réinitialiser les timers
        localStorage.removeItem("cjSessionLock");
        console.log("[cjAccount] 🔄 Compte complètement réinitialisé");
    },

    /**
     * Affiche les infos du compte dans la console (DEBUG)
     */
    debug() {
        const playerData = this.getPlayer();
        console.log("═══════════════════════════════════════════");
        console.log("📊 CJAJLK ACCOUNT DEBUG");
        console.log("═══════════════════════════════════════════");
        console.log("ID:", playerData?.id);
        console.log("Pseudo:", playerData?.pseudo);
        console.log("Total CJ:", playerData?.stats?.totalCJ);
        console.log("CJ par jeu:", playerData?.stats?.byGame);
        console.log("Badges débloqués:", playerData?.items?.unlockedBadges);
        console.log("Créé le:", playerData?.createdAt ? new Date(playerData.createdAt).toLocaleString() : "N/A");
        console.log("═══════════════════════════════════════════");
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎮 ALIAS GLOBAL POUR COMPATIBILITÉ
// ═══════════════════════════════════════════════════════════════════════════

window.CJajlkAccount = {
    // Compatibilité avec ancien API
    add: (gameName, amount) => cjAccount.addCJ(gameName, amount),
    remove: (gameName, amount) => cjAccount.removeCJ(gameName, amount),
    spend: (amount) => cjAccount.spendCJ(amount),
    unlockBadge: (badgeId) => cjAccount.unlockBadge(badgeId),
    isBadgeUnlocked: (badgeId) => cjAccount.isBadgeUnlocked(badgeId),
    getTotal: () => cjAccount.getTotalCJ(),
    getByGame: (gameName) => cjAccount.getCJByGame(gameName),
    getStats: () => cjAccount.getAllCJStats(),
    debug: () => cjAccount.debug(),
    
    // Nouveau API
    ...cjAccount
};

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 INITIALISATION AUTOMATIQUE
// ═══════════════════════════════════════════════════════════════════════════

// Explicit universal mode, while preserving legacy read-only consumers/tests.
const cjUniversalMode = document.currentScript?.dataset.universal === 'true';
if (cjUniversalMode || document.currentScript?.dataset.readonly !== 'true') {
    window.CJajlkAccount.ready = cjAccount.initialize();
}
function cjRenderIdentity() {
    document.querySelectorAll?.('[data-cj-pseudo]')?.forEach(element => {
        element.textContent = cjAccount.getDisplayPseudo(element.dataset.cjFallback || 'Joueur');
    });
}
for (const event of ['cj-account-ready', 'cj-account-updated', 'focus', 'pageshow']) window.addEventListener(event, cjRenderIdentity);
window.addEventListener('storage', event => { if (event.key === 'cjPlayerData' || event.key === null) cjRenderIdentity(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) cjRenderIdentity(); });
document.addEventListener('DOMContentLoaded', cjRenderIdentity);
cjRenderIdentity();
console.log("✅ cjAccount.js chargé (SOURCE DE VÉRITÉ UNIQUE)");

// Alias global cohérent partout
window.CjajlkAccount = cjAccount;
