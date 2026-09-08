/* ====================================
   🐾 COMPANION BONUSES SYSTEM
   Bonus gameplay liés au niveau
==================================== */

// ====================================
// CONFIGURATION
// ====================================

const COMPANION_CONFIG = {
    MAX_LEVEL: 50,
    XP_PER_LEVEL: 100,  // XP requis par niveau
    MAX_XP: 100         // XP max avant level up
};

// ====================================
// BONUS DEFINITIONS
// ====================================

const COMPANION_BONUSES = { 
    aube: {
        id: "aube",
        name: "Aube",
        element: "void",
        bonusType: "xp_multiplier",
        bonusNameKey: "bonus.aube.name",
        bonusDescriptionKey: "bonus.aube.desc",
        bonusIcon: "⭐",
        
        // Formule : 1% par niveau (max +50% au niveau 50)
        calculateBonus: (level) => {
            return Math.min(level * 1, 50); // Max 50%
        },
        
        formatBonus: (value) => i18nT("bonus.format.xp", { value: value.toFixed(1) })
    },
    
    aqua: {
        id: "aqua",
        name: "Aqua",
        element: "water",
        bonusType: "ball_speed",
        bonusNameKey: "bonus.aqua.name",
        bonusDescriptionKey: "bonus.aqua.desc",
        bonusIcon: "💨",
        
        // Formule : 0.5% par niveau (max +25% au niveau 50)
        calculateBonus: (level) => {
            return Math.min(level * 0.5, 25); // Max 25%
        },
        
        formatBonus: (value) => i18nT("bonus.format.speed", { value: value.toFixed(1) })
    },
    
    ignis: {
        id: "ignis",
        name: "Ignis",
        element: "fire",
        bonusType: "brick_damage",
        bonusNameKey: "bonus.ignis.name",
        bonusDescriptionKey: "bonus.ignis.desc",
        bonusIcon: "💥",
        
        // Formule : 1% par niveau (max +50% au niveau 50)
        calculateBonus: (level) => {
            return Math.min(level * 1, 50); // Max 50%
        },
        
        formatBonus: (value) => i18nT("bonus.format.damage", { value: value.toFixed(1) })
    },
    
    astral: {
        id: "astral",
        name: "Astral",
        element: "light",
        bonusType: "orb_drop",
        bonusNameKey: "bonus.astral.name",
        bonusDescriptionKey: "bonus.astral.desc",
        bonusIcon: "🌟",
        
        // Formule : 0.6% par niveau (max +30% au niveau 50)
        calculateBonus: (level) => {
            return Math.min(level * 0.6, 30); // Max 30%
        },
        
        formatBonus: (value) => i18nT("bonus.format.drop", { value: value.toFixed(1) })
    },
    
    flora: {
        id: "flora",
        name: "Flora",
        element: "nature",
        bonusType: "paddle_size",
        bonusNameKey: "bonus.flora.name",
        bonusDescriptionKey: "bonus.flora.desc",
        bonusIcon: "🛡️",
        
        // Formule : 0.4% par niveau (max +20% au niveau 50)
        calculateBonus: (level) => {
            return Math.min(level * 0.4, 20); // Max 20%
        },
        
        formatBonus: (value) => i18nT("bonus.format.paddle", { value: value.toFixed(1) })
    }
};

// ====================================
// HELPER FUNCTIONS
// ====================================

/**
 * Obtenir le bonus actif du compagnon équipé
 * @returns {Object|null} { type, value, companionId }
 */
function getActiveCompanionBonus() {
    try {
        if (typeof getPlayerProfile !== 'function') {
            console.warn("⚠️ getPlayerProfile not available");
            return null;
        }
        
        const profile = getPlayerProfile();
        const equippedId = profile.equippedCompanion;
        
        if (!equippedId || !COMPANION_BONUSES[equippedId]) {
            return null;
        }
        
        const companion = COMPANION_BONUSES[equippedId];
        const companionStats = profile.companions?.[equippedId] || { level: 1, xp: 0 };
        const level = Math.min(companionStats.level, COMPANION_CONFIG.MAX_LEVEL);
        
        const bonusValue = companion.calculateBonus(level);
        
        return {
            companionId: equippedId,
            companionName: companion.name,
            type: companion.bonusType,
            value: bonusValue,
            level: level,
            formatted: companion.formatBonus(bonusValue),
            icon: companion.bonusIcon,
            name: i18nT(companion.bonusNameKey)
        };
        
    } catch (error) {
        console.error("❌ Error getting companion bonus:", error);
        return null;
    }
}

/**
 * Obtenir les informations d'un compagnon spécifique
 * @param {string} companionId - ID du compagnon
 * @param {number} level - Niveau du compagnon
 * @returns {Object|null}
 */
function getCompanionBonusInfo(companionId, level = 1) {
    const companion = COMPANION_BONUSES[companionId];
    if (!companion) return null;
    
    level = Math.min(level, COMPANION_CONFIG.MAX_LEVEL);
    const bonusValue = companion.calculateBonus(level);
    
    return {
        id: companionId,
        name: companion.name,
        element: companion.element,
        bonusType: companion.bonusType,
        bonusName: i18nT(companion.bonusNameKey),
        bonusDescription: i18nT(companion.bonusDescriptionKey),
        bonusIcon: companion.bonusIcon,
        level: level,
        value: bonusValue,
        formatted: companion.formatBonus(bonusValue),
        maxLevel: COMPANION_CONFIG.MAX_LEVEL
    };
}

/**
 * Calculer le bonus à un niveau spécifique
 * @param {string} companionId - ID du compagnon
 * @param {number} level - Niveau
 * @returns {number}
 */
function calculateBonusAtLevel(companionId, level) {
    const companion = COMPANION_BONUSES[companionId];
    if (!companion) return 0;
    
    level = Math.min(level, COMPANION_CONFIG.MAX_LEVEL);
    return companion.calculateBonus(level);
}

/**
 * Vérifier si un compagnon a atteint le niveau max
 * @param {number} level - Niveau actuel
 * @returns {boolean}
 */
function isMaxLevel(level) {
    return level >= COMPANION_CONFIG.MAX_LEVEL;
}

/**
 * Obtenir la progression vers le niveau suivant
 * @param {number} xp - XP actuel
 * @returns {number} Pourcentage (0-100)
 */
function getLevelProgress(xp) {
    return Math.min((xp / COMPANION_CONFIG.XP_PER_LEVEL) * 100, 100);
}

// ====================================
// AFFICHAGE DEBUG
// ====================================

function logCompanionBonuses() {
    console.log("🐾 ===== COMPANION BONUSES SYSTEM =====");
    console.log("📊 Max Level:", COMPANION_CONFIG.MAX_LEVEL);
    console.log("⭐ XP per Level:", COMPANION_CONFIG.XP_PER_LEVEL);
    console.log("");
    
    Object.values(COMPANION_BONUSES).forEach(companion => {
        const level1 = companion.calculateBonus(1);
        const level25 = companion.calculateBonus(25);
        const level50 = companion.calculateBonus(50);
        
        console.log(`${companion.bonusIcon} ${companion.name} (${companion.element})`);
        console.log(`   Bonus: ${companion.bonusName}`);
        console.log(`   Type: ${companion.bonusType}`);
        console.log(`   Lvl 1:  ${companion.formatBonus(level1)}`);
        console.log(`   Lvl 25: ${companion.formatBonus(level25)}`);
        console.log(`   Lvl 50: ${companion.formatBonus(level50)}`);
        console.log("");
    });
}

// Auto-log au chargement
console.log("✅ Companion Bonuses System loaded");
