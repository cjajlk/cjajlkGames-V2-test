/* ====================================
   COLLECTION PAGE - JAVASCRIPT
   Affichage des compagnons débloqués
==================================== */

console.log("COLLECTION.JS CHARGÉ ✅", Date.now());


const getLang = () => (window.I18n ? window.I18n.getLanguage() : "fr");
const localize = (value) => {
    if (value && typeof value === "object") {
        const lang = getLang();
        return value[lang] || value.fr || Object.values(value)[0];
    }
    return value;
};

// ====================================
// DATA
// ====================================

const COMPANIONS_DATA = {
    aube: {
        id: "aube",
        name: { fr: "Aube", en: "Aube" },
        element: "void",
        elementName: { fr: "Vide", en: "Void" },
        description: {
            fr: "Le compagnon de départ, maître du vide. Aube possède une connexion unique avec l'essence primordiale.",
            en: "The starter companion, master of void. Aube has a unique bond with primordial essence."
        },
        imagePath: "../assets/companions/aube/aube_idle.png",
        bonuses: [
            { icon: "⚔️", text: "+5% Dégâts élémentaires" },
            { icon: "🛡️", text: "+10% Résistance au vide" },
            { icon: "⚡", text: "Compétence: Fracture dimensionnelle" }
        ]
    },
    aqua: {
        id: "aqua",
        name: { fr: "Aqua", en: "Aqua" },
        element: "water",
        elementName: { fr: "Eau", en: "Water" },
        description: {
            fr: "Maître de l'eau et des courants. Aqua contrôle les océans et purifie les énergies corrompues.",
            en: "Master of water and currents. Aqua controls the oceans and purifies corrupted energies."
        },
        imagePath: "../assets/companions/aqua/aqua_idle.png",
        bonuses: [
            { icon: "💧", text: "+8% Génération d'orbes Eau" },
            { icon: "🌊", text: "+12% Dégâts Eau" },
            { icon: "⚡", text: "Compétence: Tsunami purificateur" }
        ]
    },
    ignis: {
        id: "ignis",
        name: { fr: "Ignis", en: "Ignis" },
        element: "fire",
        elementName: { fr: "Feu", en: "Fire" },
        description: {
            fr: "Gardien des flammes éternelles. Ignis incarne la puissance destructrice et régénératrice du feu.",
            en: "Guardian of eternal flames. Ignis embodies the destructive and regenerative power of fire."
        },
        imagePath: "../assets/companions/ignis/ignis_idle.png",
        bonuses: [
            { icon: "🔥", text: "+8% Génération d'orbes Feu" },
            { icon: "💥", text: "+15% Dégâts critiques" },
            { icon: "⚡", text: "Compétence: Météore ardent" }
        ]
    },
    astral: {
        id: "astral",
        name: { fr: "Astral", en: "Astral" },
        element: "light",
        elementName: { fr: "Lumière", en: "Light" },
        description: {
            fr: "Porteur de lumière céleste. Astral guide les âmes perdues et dissipe les ténèbres.",
            en: "Bearer of celestial light. Astral guides lost souls and dispels darkness."
        },
        imagePath: "../shop/categories/companions/light/astral_idle.png",
        bonuses: [
            { icon: "✨", text: "+8% Génération d'orbes Lumière" },
            { icon: "🌟", text: "+10% Vitesse de la balle" },
            { icon: "⚡", text: "Compétence: Rayon astral" }
        ]
    },
    flora: {
        id: "flora",
        name: { fr: "Flora", en: "Flora" },
        element: "nature",
        elementName: { fr: "Nature", en: "Nature" },
        description: {
            fr: "Gardienne de la nature sauvage. Flora fait croître la vie et protège les forêts ancestrales.",
            en: "Guardian of wild nature. Flora grows life and protects ancient forests."
        },
        imagePath: "../assets/companions/flora/flora_idle.png",
        bonuses: [
            { icon: "🌿", text: "+8% Génération d'orbes Nature" },
            { icon: "💚", text: "+5% Régénération HP" },
            { icon: "⚡", text: "Compétence: Emprise des racines" }
        ]
    },
    dragonMystique: {
        id: "dragonMystique",
        name: { fr: "Dragon Mystique", en: "Mystic Dragon" },
        element: "void",
        elementName: { fr: "Vide", en: "Void" },
        description: {
            fr: "Un dragon légendaire, gardien des secrets mystiques. Peut être équipé dans l'écurie.",
            en: "A legendary dragon, guardian of mystical secrets. Can be equipped in the stable."
        },
        imagePath: "../assets/companions/dragonMystique/dragonMystique_idle.png",
        modelPath: "../assets/3d/dragon_mystique.glb",
        bonuses: [
            { icon: "🐉", text: "+20% Puissance mystique" },
            { icon: "✨", text: "+10% Vitesse d'écurie" },
            { icon: "⚡", text: "Compétence: Souffle astral" }
        ]
    }
};

const ELEMENT_COLORS = {
    water: "water",
    fire: "fire",
    light: "light",
    nature: "nature",
    void: "void"
};

// ====================================
// DOM ELEMENTS
// ====================================

const companionsGrid = document.getElementById("companionsGrid");
const collectionProgress = document.getElementById("collectionProgress");
const modal = document.getElementById("companionModal");
const modalClose = document.getElementById("modalClose");

// ====================================
// LOAD PROFILE & RENDER
// ====================================

function loadCollection() {
    console.log("📚 Loading collection...");

    // Vérifier que getPlayerProfile existe
    if (typeof getPlayerProfile !== "function") {
        console.error("❌ getPlayerProfile not available!");
        return;
    }

    const profile = getPlayerProfile();
    console.log("📊 Player profile:", profile);

    // Vérification stricte : seuls les compagnons dans unlockedCompanions sont débloqués
    let unlockedCompanions = profile.unlockedCompanions || ["aube"];
    
    // S'assurer que c'est un tableau
    if (!Array.isArray(unlockedCompanions)) {
        console.warn("⚠️ unlockedCompanions n'est pas un tableau, réinitialisation");
        unlockedCompanions = ["aube"];
        profile.unlockedCompanions = ["aube"];
        if (typeof savePlayerProfile === "function") {
            savePlayerProfile(profile);
        }
    }
    
    // Filtrer pour n'avoir que les IDs valides de compagnons existants
    const validCompanionIds = Object.keys(COMPANIONS_DATA);
    unlockedCompanions = unlockedCompanions.filter(id => validCompanionIds.includes(id));
    
    // Si la liste est vide ou invalide, ajouter au moins Aube
    if (unlockedCompanions.length === 0) {
        console.warn("⚠️ Aucun compagnon débloqué trouvé, ajout d'Aube par défaut");
        unlockedCompanions = ["aube"];
        profile.unlockedCompanions = ["aube"];
        if (typeof savePlayerProfile === "function") {
            savePlayerProfile(profile);
        }
    }
    
    const companionsStats = profile.companions || {};

    console.log("🔓 Unlocked companions:", unlockedCompanions);
    console.log("📊 Total unlocked:", unlockedCompanions.length, "/", validCompanionIds.length);
    console.log("📈 Companions stats:", companionsStats);

    // Render grid
    renderCompanionsGrid(unlockedCompanions, companionsStats);

    // Update progress
    const total = validCompanionIds.length;
    const unlocked = unlockedCompanions.length;
    collectionProgress.textContent = `${unlocked}/${total}`;

    console.log("✅ Collection loaded -", unlocked, "compagnons débloqués sur", total);
}

document.addEventListener('languagechange', () => {
    loadCollection();
});

function renderCompanionsGrid(unlocked, stats) {
    companionsGrid.innerHTML = "";

    for (const [id, data] of Object.entries(COMPANIONS_DATA)) {
        const isUnlocked = unlocked.includes(id);
        const companionStats = stats[id] || { level: 1, xp: 0 };

        const card = createCompanionCard(data, isUnlocked, companionStats);
        companionsGrid.appendChild(card);
    }
}

function createCompanionCard(data, isUnlocked, stats) {
    const card = document.createElement("div");
    card.className = `companion-card ${isUnlocked ? "" : "locked"}`;

    const elementClass = ELEMENT_COLORS[data.element] || "void";
    const displayName = localize(data.name);
    const displayElementName = localize(data.elementName);

    card.innerHTML = `
        <div class="card-image-container">
            <img src="${data.imagePath}" alt="${displayName}" class="card-image">
            <div class="element-badge ${elementClass}">${displayElementName}</div>
            ${!isUnlocked ? '<div class="lock-icon">🔒</div>' : ''}
        </div>
        <div class="card-info">
            <h3 class="card-name">${displayName}</h3>
            ${isUnlocked ? `<p class="card-level">${i18nT('common.level')} ${stats.level}</p>` : ''}
            <span class="card-status ${isUnlocked ? 'unlocked' : 'locked'}">
                ${isUnlocked ? i18nT('collection.statusUnlocked') : i18nT('collection.statusLocked')}
            </span>
        </div>
    `;

    if (isUnlocked) {
        card.addEventListener("click", () => openModal(data, stats));
    }

    return card;
}

// ====================================
// MODAL
// ====================================

function openModal(data, stats) {
    const displayName = localize(data.name);
    console.log("📖 Opening modal for:", displayName);

    const elementClass = ELEMENT_COLORS[data.element] || "void";
    const displayDescription = localize(data.description);
    const displayElementName = localize(data.elementName);

    // Set image or model-viewer
    const modalImageContainer = document.getElementById("modalImageContainer");
    if (modalImageContainer) {
        modalImageContainer.innerHTML = data.modelPath ?
            `<model-viewer src="${data.modelPath}" alt="${displayName}" camera-controls auto-rotate interaction-prompt="none" loading="eager" style="width:100%;height:220px;background:transparent;border:none;"></model-viewer>`
            : `<img src="${data.imagePath}" alt="${displayName}" class="modal-image">`;
    }
    
    const modalElement = document.getElementById("modalElement");
    if (modalElement) {
        modalElement.textContent = displayElementName;
        modalElement.className = `modal-element-badge element-badge ${elementClass}`;
    }

    // Set info
    const modalName = document.getElementById("modalName");
    if (modalName) modalName.textContent = displayName;
    const modalDescription = document.getElementById("modalDescription");
    if (modalDescription) modalDescription.textContent = displayDescription;

    // Set bonuses (use real companion bonus system)
    const bonusesList = document.getElementById("modalBonuses");
    if (bonusesList) {
        if (typeof getCompanionBonusInfo === 'function') {
            const bonusInfo = getCompanionBonusInfo(data.id, stats.level);
            if (bonusInfo) {
                bonusesList.innerHTML = `
                    <div class="bonus-item main-bonus">
                        <span class="bonus-icon">${bonusInfo.bonusIcon}</span>
                        <span class="bonus-text"><strong>${bonusInfo.bonusName}:</strong> ${bonusInfo.formatted}</span>
                    </div>
                    <div class="bonus-description">
                        ${bonusInfo.bonusDescription}
                    </div>
                    <div class="bonus-progression">
                        <small>Niveau ${stats.level}/${bonusInfo.maxLevel}</small>
                    </div>
                `;
            } else {
                // Fallback
                bonusesList.innerHTML = data.bonuses.map(bonus => `
                    <div class="bonus-item">
                        <span class="bonus-icon">${bonus.icon}</span>
                        <span class="bonus-text">${bonus.text}</span>
                    </div>
                `).join('');
            }
        } else {
            // Fallback si companionBonuses.js n'est pas chargé
            bonusesList.innerHTML = data.bonuses.map(bonus => `
                <div class="bonus-item">
                    <span class="bonus-icon">${bonus.icon}</span>
                    <span class="bonus-text">${bonus.text}</span>
                </div>
            `).join('');
        }
    }

    // Set stats
    const modalLevel = document.getElementById("modalLevel");
    if (modalLevel) modalLevel.textContent = stats.level;
    const modalXP = document.getElementById("modalXP");
    if (modalXP) modalXP.textContent = `${stats.xp} / 100`;

    // Show modal
    if (modal) modal.classList.remove("hidden");
}

function closeModal() {
    modal.classList.add("hidden");
}

// ====================================
// NAVIGATION
// ====================================

function setupNavigation() {
    const backBtn = document.getElementById("goBack");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            window.location.href = "../pages/mainmenu.html";
        });
    }

    // Close modal
    if (modalClose) {
        modalClose.addEventListener("click", closeModal);
    }

    // Close modal on overlay click
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // ESC key to close modal
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) {
            closeModal();
        }
    });
}

// ====================================
// INIT
// ====================================

window.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Collection page loading...");
    
    loadCollection();
    setupNavigation();
    
    console.log("✅ Collection page initialized");
});
