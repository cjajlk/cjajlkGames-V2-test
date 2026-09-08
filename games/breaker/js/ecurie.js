
// ===== Affichage central du compagnon sélectionné =====
function updateInfoPanel() {
    const infoPanel = document.getElementById('infoPanel');
    const display = document.getElementById('main-companion-display');
    const nameEl = document.getElementById('companionName');
    const levelEl = document.getElementById('companionLevel');
    const mobileNameEl = document.getElementById('mobileCompanionName');
    const mobileLevelEl = document.getElementById('mobileCompanionLevel');
    const xpEl = document.getElementById('companionXpBar');
    const bonusEl = document.getElementById('companionBonus');
    const mobileToggle = document.getElementById('mobileInfoToggle');
    const mobilePanel = document.querySelector('.companion-info-panel');

    // Nettoyer l'affichage central
    if (display) display.innerHTML = '';

    // Affichage du compagnon sélectionné (PNG ou 3D)
    if (display && window.selectedCompanion) {
        if (window.selectedCompanion.glb) {
            const mv = document.createElement('model-viewer');
            const src = window.selectedCompanion.glb.startsWith('/') ? window.selectedCompanion.glb : `../${window.selectedCompanion.glb}`;
            mv.src = src;
            mv.alt = window.selectedCompanion.name;
            mv.setAttribute('camera-controls', '');
            mv.setAttribute('auto-rotate', '');
            mv.setAttribute('interaction-prompt', 'none');
            mv.setAttribute('loading', 'eager');
            mv.style.width = '100%';
            mv.style.height = '100%';
            mv.style.background = 'transparent';
            mv.style.border = 'none';
            display.appendChild(mv);
        } else if (window.selectedCompanion.img) {
            const img = document.createElement('img');
            img.src = window.selectedCompanion.img.src;
            img.alt = window.selectedCompanion.name;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.display = 'block';
            img.style.margin = '0 auto';
            img.loading = 'eager';
            display.appendChild(img);
        } else {
            // Placeholder si rien à afficher
            const placeholder = document.createElement('div');
            placeholder.className = 'companion-placeholder';
            placeholder.textContent = '?';
            display.appendChild(placeholder);
        }
    }

    // Affichage des infos (nom, niveau, xp, bonus)
    if (nameEl) nameEl.textContent = window.selectedCompanion ? window.selectedCompanion.name : '';
    if (mobileNameEl) mobileNameEl.textContent = window.selectedCompanion ? window.selectedCompanion.name : '';

    if (!window.selectedCompanion || !window.selectedCompanion.unlocked) {
        if (levelEl) levelEl.textContent = i18nT("ecurie.locked");
        if (mobileLevelEl) mobileLevelEl.textContent = i18nT("ecurie.locked");
        if (xpEl) xpEl.style.width = '0%';
        if (bonusEl) bonusEl.textContent = '🔒 --';
    } else {
        const maxLevel = typeof COMPANION_CONFIG !== 'undefined' ? COMPANION_CONFIG.MAX_LEVEL : 50;
        const isMax = window.selectedCompanion.level >= maxLevel;
        if (levelEl) {
            const levelLabel = i18nT("common.levelShort");
            const maxLabel = i18nT("ecurie.max");
            levelEl.textContent = isMax 
                ? `${levelLabel} ${window.selectedCompanion.level} ${maxLabel}` 
                : `${levelLabel} ${window.selectedCompanion.level}/${maxLevel}`;
        }
        if (mobileLevelEl) {
            const levelLabel = i18nT("common.levelShort");
            const maxLabel = i18nT("ecurie.max");
            mobileLevelEl.textContent = isMax
                ? `${levelLabel} ${window.selectedCompanion.level} ${maxLabel}`
                : `${levelLabel} ${window.selectedCompanion.level}/${maxLevel}`;
        }
        if (xpEl) {
            if (isMax) {
                xpEl.style.width = '100%';
            } else {
                const xpPercent = (window.selectedCompanion.xp / 100) * 100;
                xpEl.style.width = xpPercent + '%';
            }
        }
        if (bonusEl && typeof getCompanionBonusInfo === 'function') {
            const bonusInfo = getCompanionBonusInfo(window.selectedCompanion.id, window.selectedCompanion.level);
            if (bonusInfo) {
                bonusEl.textContent = `${bonusInfo.bonusIcon} ${bonusInfo.formatted}`;
                bonusEl.title = bonusInfo.bonusDescription;
            } else {
                bonusEl.textContent = '--';
            }
        }
    }

    // Affichage du type d'orbe
    if (infoPanel && window.selectedCompanion) {
        const orbType = window.selectedCompanion.orbType;
        const orbIcon = ORB_ICONS[orbType] || "";
        const orbLabel = ORB_LABELS[orbType] || orbType;
        let orbHint = infoPanel.querySelector('.orb-hint');
        if (!orbHint) {
            orbHint = document.createElement('div');
            orbHint.className = 'orb-hint';
            infoPanel.appendChild(orbHint);
        }
        orbHint.textContent = `Orbe: ${orbIcon} ${orbLabel}`;
    }

    if (mobileToggle && mobilePanel) {
        const isOpen = mobilePanel.classList.contains('is-open');
        mobileToggle.textContent = isOpen ? 'Infos' : 'Détails';
        mobileToggle.setAttribute('aria-expanded', String(isOpen));
    }
}
/* ==========================================
   🐾 BREAKER ÉCURIE - AAA PROFESSIONAL EDITION
   ========================================== */

// ===== Companions Data =====
let companions = [];

function loadCompanions() {
    companions = [];
    const profile = typeof getPlayerProfile === "function" ? getPlayerProfile() : {};
    const unlocked = profile.unlockedCompanions || ["aube"];
    fetch("../data/shopData.json")
        .then(res => res.json())
        .then(shopData => {
            const items = shopData.categories.find(cat => (cat.id || cat.name?.fr) === "companions" || cat.name?.fr === "Mascottes")?.items || [];
            items.forEach(item => {
                const c = {
                    id: item.id,
                    name: typeof item.name === "object" ? item.name.fr : item.name,
                    unlocked: unlocked.includes(item.id),
                    level: profile.companions?.[item.id]?.level || (item.id === "aube" ? 1 : 0),
                    xp: profile.companions?.[item.id]?.xp || 0,
                    orbType: item.orbType || "void",
                    glb: item.glb || item.gbl || null, // injection directe depuis shopData.json
                    image: item.image || null
                };
                // Si un modèle 3D existe, on ne charge pas d'image PNG
                if (c.glb) {
                    // rien à faire ici, affichage dynamique plus bas
                } else {
                    const img = new Image();
                    if (c.id === "astral") {
                        img.src = `../shop/categories/companions/light/astral_idle.png`;
                    } else {
                        img.src = `../assets/companions/${c.id}/${c.id}_idle.png`;
                    }
                    c.img = img;
                }
                companions.push(c);
            });
            // Initialiser selectedCompanion et selectedIndex
            if (companions.length > 0) {
                window.selectedIndex = 0;
                window.selectedCompanion = companions[0];
            } else {
                window.selectedIndex = 0;
                window.selectedCompanion = undefined;
            }
            generateSlots();
            updateInfoPanel();
        });
}

// Appeler loadCompanions au démarrage
window.addEventListener("DOMContentLoaded", loadCompanions);

function setupMobileInfoToggle() {
    const mobileToggle = document.getElementById('mobileInfoToggle');
    const mobilePanel = document.querySelector('.companion-info-panel');
    if (!mobileToggle || !mobilePanel) return;

    mobileToggle.addEventListener('click', () => {
        mobilePanel.classList.toggle('is-open');
        updateInfoPanel();
    });

    mobilePanel.classList.remove('is-open');
}

window.addEventListener('DOMContentLoaded', setupMobileInfoToggle);

// Permettre le rafraîchissement dynamique depuis la boutique
window.addEventListener("companionUnlocked", () => {
    console.log("🔄 Rafraîchissement écurie suite à un achat en boutique");
    loadCompanions();
});

const ORB_LABELS = {
    water: "Eau",
    fire: "Feu",
    light: "Lumiere",
    nature: "Nature",
    void: "Void"
};

const ORB_ICONS = {
    water: "💧",
    fire: "🔥",
    light: "✨",
    nature: "🌿",
    void: "🟣"
};

const FEED_VIDEO_BY_COMPANION = {
    aube: "aube",
    aqua: "blue",
    ignis: "fire",
    astral: "light",
    flora: "nature"
};

// Load companion images
companions.forEach(c => {
    // Affichage harmonisé : modèle 3D si dispo, sinon PNG
    const glbUrl = c.glb || c.gbl;
    if (glbUrl) {
        c.modelViewer = document.createElement('model-viewer');
        // Si chemin absolu, on l'utilise tel quel, sinon on préfixe
        const src = glbUrl.startsWith('/') ? glbUrl : `../${glbUrl}`;
        c.modelViewer.setAttribute('src', src);
        c.modelViewer.setAttribute('alt', c.name);
        c.modelViewer.setAttribute('auto-rotate', '');
        c.modelViewer.setAttribute('camera-controls', '');
        c.modelViewer.style.width = '100%';
        c.modelViewer.style.height = '120px';
        c.modelViewer.style.backgroundColor = 'transparent';
    } else {
        const img = new Image();
        if (c.id === "astral") {
            img.src = `../shop/categories/companions/light/astral_idle.png`;
        } else {
            img.src = `../assets/companions/${c.id}/${c.id}_idle.png`;
        }
        c.img = img;
    }
});

// Ensure Aube is first
companions.sort((a, b) => {
    if (a.id === "aube") return -1;
    if (b.id === "aube") return 1;
    return 0;
});

// ===== State Variables =====
let selectedIndex = 0;
let selectedCompanion = companions[0];
let floatTime = 0;
let equipTransition = 0;
let playingFeed = false;
let feedVideo = null;
let feedSkipBtn = null;

// ===== Toast Notification System =====
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}



// ===== Generate Companion Slots =====
function generateSlots() {
    const container = document.getElementById('slotsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    companions.forEach((c, index) => {
        const slot = document.createElement('div');
        slot.className = 'companion-slot';
        if (!c.unlocked) {
            slot.classList.add('locked');
        }
        if (index === selectedIndex) {
            slot.classList.add('selected');
        }
        // Affichage dynamique : modèle 3D si glb existe, sinon image PNG
        const visualContainer = document.createElement('div');
        visualContainer.className = 'companion-visual-container';
        if (c.glb) {
            const mv = document.createElement('model-viewer');
            const src = c.glb.startsWith('/') ? c.glb : `../${c.glb}`;
            mv.src = src;
            mv.alt = c.name;
            mv.setAttribute('camera-controls', '');
            mv.setAttribute('auto-rotate', '');
            mv.setAttribute('interaction-prompt', 'none');
            mv.setAttribute('loading', 'eager');
            mv.className = 'shop-model';
            mv.style.width = '100%';
            mv.style.height = '100%';
            mv.style.background = 'transparent';
            mv.style.border = 'none';
            visualContainer.appendChild(mv);
        } else if (c.img && c.img.complete) {
            const img = document.createElement('img');
            img.src = c.img.src;
            img.alt = c.name;
            visualContainer.appendChild(img);
        } else {
            // Si ni glb ni image, afficher un placeholder générique
            const placeholder = document.createElement('div');
            placeholder.className = 'companion-placeholder';
            placeholder.textContent = '?';
            visualContainer.appendChild(placeholder);
        }
        const orbBadge = document.createElement('span');
        orbBadge.className = 'orb-badge';
        orbBadge.textContent = ORB_ICONS[c.orbType] || '';
        orbBadge.title = `Orbe: ${ORB_LABELS[c.orbType] || c.orbType}`;
        visualContainer.appendChild(orbBadge);
        // Affichage du cadenas si non débloqué
        if (!c.unlocked) {
            const lockIcon = document.createElement('div');
            lockIcon.className = 'lock-icon';
            lockIcon.textContent = '🔒';
            visualContainer.appendChild(lockIcon);
        }
        slot.appendChild(visualContainer);
        slot.addEventListener('click', () => {
            if (c.unlocked) {
                selectCompanion(index);
            } else {
                showToast(i18nT("ecurie.lockedToast"), 'error');
            }
        });
        
        container.appendChild(slot);
    });
}

// ===== Select Companion =====
function selectCompanion(index) {
    if (index < 0 || index >= companions.length) return;
    if (!companions[index].unlocked) return;

    selectedIndex = index;
    selectedCompanion = companions[index];
    // Synchroniser avec window pour updateInfoPanel
    window.selectedIndex = index;
    window.selectedCompanion = companions[index];

    updateInfoPanel();
    generateSlots();

    // Visual feedback
    equipTransition = 0.3;
}

// ===== Equip Companion =====
function equipCompanion() {
    if (!selectedCompanion.unlocked) {
        showToast(i18nT("ecurie.equipLockedToast"), 'error');
        return;
    }
    
    equipTransition = 1;
    
    const profile = getPlayerProfile();
    console.log("⚔️ Equipping companion:", selectedCompanion.id);
    console.log("📋 Before equip - equippedCompanion:", profile.equippedCompanion);
    
    profile.equippedCompanion = selectedCompanion.id;
    savePlayerProfile(profile);
    
    // Vérification
    const verified = getPlayerProfile();
    console.log("✅ After equip - equippedCompanion:", verified.equippedCompanion);
    
    showToast(`⚔️ ${selectedCompanion.name} équipé !`, 'success');
}

// ===== Feed Companion =====
function feedCompanion() {
    let profile = getPlayerProfile();
    if (!profile || !selectedCompanion) return;
    
    if (!selectedCompanion.unlocked) {
        showToast(i18nT("ecurie.equipLockedToast"), 'error');
        return;
    }
    
    // Vérifier le niveau max
    const maxLevel = typeof COMPANION_CONFIG !== 'undefined' ? COMPANION_CONFIG.MAX_LEVEL : 50;
    if (selectedCompanion.level >= maxLevel && selectedCompanion.xp >= 100) {
        showToast(i18nT("ecurie.maxLevel", { name: selectedCompanion.name, max: maxLevel }), 'info');
        return;
    }
    
    const orbType = selectedCompanion.orbType;
    const orbCount = profile.orbs?.[orbType] || 0;
    
    if (orbCount <= 0) {
        showToast(`${i18nT("ecurie.feedNoOrbs")} ${orbType} !`, 'error');
        return;
    }
    
    // Consume 1 orb
    if (!consumeOrb(orbType, 1)) return;

    // Refresh profile to keep orb changes before further saves
    profile = getPlayerProfile();
    
    // Update profile
    const companionId = selectedCompanion.id;
    if (!profile.companions) profile.companions = {};
    if (!profile.companions[companionId]) {
        profile.companions[companionId] = { level: 1, xp: 0 };
    }
    
    profile.companions[companionId].xp += 10;
    
    console.log("🍖 Feeding companion:", companionId);
    console.log("📊 Before save - Level:", profile.companions[companionId].level, "XP:", profile.companions[companionId].xp);
    
    let leveledUp = false;
    
    // Level up check
    if (profile.companions[companionId].xp >= 100 && profile.companions[companionId].level < maxLevel) {
        profile.companions[companionId].xp = 0;
        profile.companions[companionId].level += 1;
        leveledUp = true;
        
        // Afficher le nouveau bonus
        if (typeof getCompanionBonusInfo === 'function') {
            const bonusInfo = getCompanionBonusInfo(companionId, profile.companions[companionId].level);
            if (bonusInfo) {
                showToast(`🎉 ${i18nT("common.levelShort")} ${profile.companions[companionId].level} ! ${bonusInfo.bonusIcon} ${bonusInfo.formatted}`, 'success');
            } else {
                showToast(i18nT("ecurie.levelUp", { name: selectedCompanion.name, level: profile.companions[companionId].level }), 'success');
            }
        } else {
            showToast(i18nT("ecurie.levelUp", { name: selectedCompanion.name, level: profile.companions[companionId].level }), 'success');
        }
    } else {
        showToast(i18nT("ecurie.feedXp", { name: selectedCompanion.name }), 'info');
    }
    
    savePlayerProfile(profile);
    
    // Vérification
    const verified = getPlayerProfile();
    console.log("✅ After save - Level:", verified.companions[companionId].level, "XP:", verified.companions[companionId].xp);
    updateOrbHUD();
    
    // Update local companion data
    selectedCompanion.level = profile.companions[companionId].level;
    selectedCompanion.xp = profile.companions[companionId].xp;
    updateInfoPanel();
    
    // Play feeding video
    playFeedingVideo();
}

// ===== Play Feeding Video =====
function playFeedingVideo() {
    if (playingFeed) return;
    
    feedVideo = document.getElementById('feedVideoOverlay');
    if (!feedVideo) return;

    if (feedSkipBtn) {
        feedSkipBtn.classList.add('show');
    }
    
    const videoKey = FEED_VIDEO_BY_COMPANION[selectedCompanion.id] || selectedCompanion.id;
    feedVideo.src = `../assets/video/${videoKey}.mp4`;
    feedVideo.style.display = 'block';
    feedVideo.currentTime = 0;
    
    feedVideo.play().catch(err => {
        console.error('Video playback error:', err);
        feedVideo.style.display = 'none';
    });
    
    playingFeed = true;
    
    feedVideo.onended = () => {
        stopFeedingVideo(true);
    };
}

function stopFeedingVideo(withFlash) {
    if (!playingFeed) return;

    if (feedVideo) {
        feedVideo.pause();
        feedVideo.currentTime = 0;
        feedVideo.style.display = 'none';
        feedVideo.onended = null;
    }

    playingFeed = false;

    if (feedSkipBtn) {
        feedSkipBtn.classList.remove('show');
    }

    if (!withFlash) return;

    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.inset = '0';
    flash.style.background = 'white';
    flash.style.opacity = '0.6';
    flash.style.zIndex = '10000';
    flash.style.transition = 'opacity 0.4s ease';
    flash.style.pointerEvents = 'none';
    
    document.body.appendChild(flash);
    
    setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 400);
    }, 100);
}

// ===== Draw Companion in Center =====

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', () => {
    // Load profile and sync companions
    const profile = getPlayerProfile();
    
    companions.forEach(c => {
        if (profile.companions && profile.companions[c.id]) {
            c.level = profile.companions[c.id].level;
            c.xp = profile.companions[c.id].xp || 0;
        }
        c.unlocked = profile.unlockedCompanions?.includes(c.id) || c.id === 'aube';
    });
    
    // Sélectionner le premier compagnon débloqué
    const firstUnlocked = companions.findIndex(c => c.unlocked);
    if (firstUnlocked >= 0) {
        selectedIndex = firstUnlocked;
        selectedCompanion = companions[firstUnlocked];
        console.log("✅ Compagnon sélectionné:", selectedCompanion.id);
    } else {
        selectedIndex = 0;
        selectedCompanion = undefined;
        console.log("⚠️ Aucun compagnon sélectionné.");
    }

    console.log("🐾 Tous les companions:", companions);
    console.log("🐾 Compagnons débloqués:", companions.filter(c => c.unlocked).map(c => c.id));
    
    // Setup UI
    generateSlots();
    updateOrbHUD();
    updateInfoPanel();
    
    // Button event listeners
    const btnEquip = document.getElementById('btnEquip');
    const btnFeed = document.getElementById('btnFeed');
    feedSkipBtn = document.getElementById('feedSkipBtn');
    
    if (btnEquip) {
        btnEquip.addEventListener('click', equipCompanion);
    }
    
    if (btnFeed) {
        btnFeed.addEventListener('click', feedCompanion);
    }

    if (feedSkipBtn) {
        feedSkipBtn.addEventListener('click', () => {
            stopFeedingVideo(false);
        });
    }
    

    document.addEventListener('languagechange', () => {
        updateInfoPanel();
    });
});


