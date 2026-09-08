/* ================================
   CAMPAGNE - SYSTÈME DE PROGRESSION
   ================================ */

// 🌍 Configuration des thèmes (facile à étendre)
const THEME_CONFIG = {
    'theme1_city_reborn': {
        worldId: 1,
        name: 'Ville Renaissante',
        bgPath: '../assets/backgrounds/gameplay/theme1_city_reborn/bg1.png',
        levelStart: 1,
        levelEnd: 5,
        bossId: 6
    },
    'theme Sanctuaire Astral': {
        worldId: 2,
        name: 'Sanctuaire Astral',
        bgPath: '../assets/backgrounds/gameplay/theme%20Sanctuaire%20Astral/bg1.png',
        levelStart: 7,
        levelEnd: 11,
        bossId: 12,
        requiresBoss: 6  // Déblocké après battre ce boss
    }
    // 🔧 Ajoute d'autres thèmes ici à l'avenir
};

let allLevels = [];
let playerProfile = null;

// Fonction de popup personnalisée AAA
function showAlert(message) {
    // Utiliser Popup.alert s'il existe
    if (typeof Popup !== 'undefined' && Popup.alert && typeof Popup.alert === 'function') {
        Popup.alert(message);
    } else {
        // Créer un popup personnalisé stylisé
        createCustomAlert(message);
    }
}

function createCustomAlert(message) {
    // Vérifier si un popup est déjà ouvert
    const existing = document.querySelector('.custom-alert-overlay');
    if (existing) existing.remove();

    // Créer les éléments
    const overlay = document.createElement('div');
    overlay.className = 'custom-alert-overlay';
    
    const alertBox = document.createElement('div');
    alertBox.className = 'custom-alert-box';
    
    const content = document.createElement('div');
    content.className = 'custom-alert-content';
    content.textContent = message;
    content.style.wordWrap = 'break-word';
    
    const button = document.createElement('button');
    button.className = 'custom-alert-btn';
    button.textContent = 'OK';
    button.style.marginTop = '20px';
    
    const closeHandler = () => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 300);
    };
    
    button.addEventListener('click', closeHandler);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeHandler();
    });
    
    // Fermer avec Échap
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeHandler();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    // Assembler
    alertBox.appendChild(content);
    alertBox.appendChild(button);
    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);
    
    // Animation d'entrée
    setTimeout(() => overlay.classList.add('fade-in'), 10);
    button.focus();
}

// Charger les niveaux et le profil
async function initCampaign() {
    try {
        console.log('📍 Chargement de la campagne...');
        
        // Charger les niveaux
        const response = await fetch('../data/levels.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.levels || !Array.isArray(data.levels)) {
            throw new Error('Données de niveaux invalides');
        }
        
        allLevels = data.levels;
        console.log('✅ Niveaux chargés:', allLevels.length, 'niveaux trouvés');

        // Charger le profil du joueur
        playerProfile = JSON.parse(localStorage.getItem('breaker_profile')) || createDefaultProfile();
        
        // S'assurer que les arrays existent
        if (!playerProfile.levelsCompleted) playerProfile.levelsCompleted = [];
        if (!playerProfile.bossesCompleted) playerProfile.bossesCompleted = [];
        
        console.log('✅ Profil chargé');

        updateCampaignUI();
        setupEventListeners();
        console.log('✅ Campagne initialisée');
    } catch (error) {
        console.error("❌ Erreur lors du chargement de la campagne:", error);
        console.error("Stack:", error.stack);
        
        // Fallback: initialiser avec des valeurs par défaut
        allLevels = [];
        playerProfile = createDefaultProfile();
        setupEventListeners();
    }
}

function createDefaultProfile() {
    return {
        level: 1,
        xp: 0,
        diamonds: 0,
        health: 100,
        bossesCompleted: [],
        levelsCompleted: [],
        companions: {
            aqua: { level: 1, xp: 0 },
            ignis: { level: 1, xp: 0 },
            astral: { level: 1, xp: 0 },
            flora: { level: 1, xp: 0 },
            aube: { level: 1, xp: 0 }
        }
    };
}

function loadThemeBackgrounds() {
    console.log('🖼️ Chargement des backgrounds des thèmes...');
    
    // Charger les images de fond pour chaque thème
    for (const [themeId, themeData] of Object.entries(THEME_CONFIG)) {
        const worldCard = document.querySelector(`[data-theme="${themeId}"]`);
        
        if (worldCard) {
            const bgElement = worldCard.querySelector('.world-bg');
            if (bgElement) {
                bgElement.style.backgroundImage = `url('${themeData.bgPath}')`;
                bgElement.style.backgroundSize = 'cover';
                bgElement.style.backgroundPosition = 'center';
                console.log(`✅ Background chargé pour ${themeId}`);
            } else {
                console.warn(`⚠️ Élément .world-bg non trouvé pour ${themeId}`);
            }
        } else {
            console.warn(`⚠️ Carte thème ${themeId} non trouvée`);
        }
    }
}

function setupEventListeners() {
    console.log('🔧 Configuration des événements...');
    
    // Bouton retour
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '../pages/mainmenu.html';
        });
    }

    // Charger les backgrounds des thèmes
    loadThemeBackgrounds();

    // Configurer les boutons de jeu pour chaque thème
    for (const [themeId, themeData] of Object.entries(THEME_CONFIG)) {
        const btn = document.querySelector(`.world${themeData.worldId}Btn`);
        
        if (btn) {
            btn.addEventListener('click', () => {
                console.log(`🎮 Clic sur monde ${themeData.worldId}`);
                
                // Vérifier les conditions de déblocage
                if (themeData.requiresBoss && !playerProfile.bossesCompleted.includes(themeData.requiresBoss)) {
                    console.warn(`🔒 Thème ${themeData.worldId} verrouillé - boss ${themeData.requiresBoss} non complété`);
                    showAlert('Vaincre le Gardien de la Cité pour débloquer ce thème');
                } else {
                    selectWorld(themeData.worldId);
                }
            });
        } else {
            console.warn(`⚠️ Bouton monde ${themeData.worldId} non trouvé`);
        }
    }

    // Fermer le sélecteur
    const closeLevelSelector = document.getElementById('closeLevelSelector');
    if (closeLevelSelector) {
        closeLevelSelector.addEventListener('click', () => {
            const levelSelector = document.getElementById('levelSelector');
            if (levelSelector) {
                levelSelector.classList.add('hidden');
            }
        });
    }
    
    console.log('✅ Événements configurés');
}

function selectWorld(worldNum) {
    if (!allLevels || allLevels.length === 0) {
        console.warn("⚠️ Aucun niveau chargé");
        showAlert("Erreur: Niveaux non chargés");
        return;
    }
    
    const levelSelector = document.getElementById('levelSelector');
    const levelList = document.getElementById('levelList');
    
    if (!levelSelector || !levelList) {
        console.error("❌ Sélecteur de niveau non trouvé");
        showAlert("Erreur: Interface incomplète");
        return;
    }
    
    levelList.innerHTML = '';

    // Trouver la configuration du thème
    const themeData = Object.values(THEME_CONFIG).find(t => t.worldId === worldNum);
    
    if (!themeData) {
        console.error(`❌ Thème monde ${worldNum} non trouvé`);
        showAlert("Erreur: Thème non trouvé");
        return;
    }

    // Récupérer les niveaux de ce thème
    const worldLevels = allLevels.filter(l => 
        l.id >= themeData.levelStart && l.id <= themeData.levelEnd
    );

    if (worldLevels.length === 0) {
        console.warn(`⚠️ Aucun niveau pour le thème monde ${worldNum}`);
        showAlert("Aucun niveau disponible");
        return;
    }

    console.log(`📍 Sélection du monde ${worldNum} - ${worldLevels.length} niveaux`);
    console.log('Niveaux complétés:', playerProfile.levelsCompleted);
    console.log('Boss complétés:', playerProfile.bossesCompleted);

    worldLevels.forEach(level => {
        const isCompleted = playerProfile.levelsCompleted.includes(level.id);
        
        // Déblocage linéaire: un niveau est débloqué s'il est le premier OU si le précédent est complété
        let isLocked = false;
        let lockReason = '';
        
        if (level.id === themeData.levelStart) {
            // Premier niveau du thème
            // Débloqué si: c'est le thème 1 OU si le boss du thème précédent est complété
            if (themeData.requiresBoss) {
                isLocked = !playerProfile.bossesCompleted.includes(themeData.requiresBoss);
                lockReason = `Complète le boss ${themeData.requiresBoss} pour débloquer`;
                console.log(`  Niveau ${level.id}: ${isLocked ? '🔒 VERROUILLÉ' : '✅ DÉBLOQUÉ'} (boss ${themeData.requiresBoss} ${playerProfile.bossesCompleted.includes(themeData.requiresBoss) ? 'complété' : 'non complété'})`);
            } else {
                console.log(`  Niveau ${level.id}: ✅ DÉBLOQUÉ (premier niveau)`);
            }
        } else {
            // Niveaux suivants: débloqués si le précédent est complété
            const previousLevelId = level.id - 1;
            isLocked = !playerProfile.levelsCompleted.includes(previousLevelId);
            lockReason = `Complète le niveau ${previousLevelId} pour débloquer`;
            console.log(`  Niveau ${level.id}: ${isLocked ? '🔒 VERROUILLÉ' : '✅ DÉBLOQUÉ'} (niveau ${previousLevelId} ${playerProfile.levelsCompleted.includes(previousLevelId) ? 'complété' : 'non complété'})`);
        }

        const levelEl = document.createElement('div');
        levelEl.className = `level-item ${isLocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`;

        const statusIcon = level.isBoss ? '⚔️' : isCompleted ? '✅' : '';
        const lockIcon = isLocked ? ' 🔒' : '';

        levelEl.innerHTML = `
            <span class="level-name">${statusIcon} ${level.name}${lockIcon}</span>
            <span class="level-status">#${level.id}</span>
        `;

        if (!isLocked) {
            levelEl.addEventListener('click', () => {
                startGame(level.id);
            });
        } else {
            // Niveau verrouillé - afficher un message
            levelEl.addEventListener('click', () => {
                showAlert(lockReason);
            });
        }

        levelList.appendChild(levelEl);
    });

    levelSelector.classList.remove('hidden');
}

function startGame(levelId) {
    console.log(`🎮 Démarrage du niveau ${levelId}`);
    
    // Sauvegarder le niveau sélectionné
    localStorage.setItem('selectedLevel', levelId);
    window.location.href = 'gameplay.html';
}

function updateCampaignUI() {
    if (!allLevels || allLevels.length === 0) {
        console.warn("⚠️ Aucun niveau chargé pour mettre à jour l'UI");
        return;
    }
    
    if (!playerProfile) {
        console.warn("⚠️ Profil non chargé");
        return;
    }
    
    // S'assurer que les arrays existent
    if (!Array.isArray(playerProfile.levelsCompleted)) {
        playerProfile.levelsCompleted = [];
    }
    if (!Array.isArray(playerProfile.bossesCompleted)) {
        playerProfile.bossesCompleted = [];
    }
    
    console.log('🎨 Mise à jour de l\'UI campagne...');
    
    // Mettre à jour l'affichage de chaque thème
    for (const [themeId, themeData] of Object.entries(THEME_CONFIG)) {
        const worldNum = themeData.worldId;
        const worldCard = document.getElementById(`worldCard${worldNum}`);
        
        if (!worldCard) {
            console.warn(`⚠️ Carte monde ${worldNum} non trouvée`);
            continue;
        }
        
        // Récupérer les niveaux de ce thème (sauf le boss)
        const themeLevels = allLevels.filter(l => 
            l.id >= themeData.levelStart && l.id <= themeData.levelEnd && !l.isBoss
        );
        
        const completedCount = playerProfile.levelsCompleted.filter(id => 
            id >= themeData.levelStart && id <= themeData.levelEnd && !allLevels.find(l => l.id === id && l.isBoss)
        ).length;
        
        // Mettre à jour la progression
        const progressEl = document.getElementById(`world${worldNum}Progress`);
        const progressBarEl = document.getElementById(`world${worldNum}ProgressBar`);
        
        if (progressEl) {
            progressEl.textContent = `${completedCount}/${themeLevels.length}`;
        }
        
        if (progressBarEl) {
            const progressPercent = themeLevels.length > 0 ? (completedCount / themeLevels.length) * 100 : 0;
            progressBarEl.style.width = `${progressPercent}%`;
        }

        // Vérifier le déblocage
        if (themeData.requiresBoss) {
            const isBossCompleted = playerProfile.bossesCompleted.includes(themeData.requiresBoss);
            const btn = document.querySelector(`.world${worldNum}Btn`);
            
            if (isBossCompleted) {
                worldCard.classList.remove('locked');
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'JOUER';
                    btn.classList.remove('locked');
                }
                console.log(`✅ Thème ${worldNum} débloqué`);
            }
        }
    }
}

// Initialiser au chargement
if (document.readyState === 'loading') {
    // Document en cours de chargement
    document.addEventListener('DOMContentLoaded', initCampaign);
} else {
    // Document déjà chargé
    console.log('📄 Document déjà chargé, initialisation directe');
    initCampaign();
}
