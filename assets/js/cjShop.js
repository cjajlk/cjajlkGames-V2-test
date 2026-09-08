// ======== Nouvelle Structure Boutique CJ : Images Breaker & Attrape-les-tous ========
const IMAGE_ITEMS = [
  // Breaker
  {
    id: "breaker_mascotte_1",
    name: "Mascotte AQUA",
    category: "breaker",
    type: "image",
    price: 20,
    src: "../games/breaker/assets/companions/aqua/aqua_idle.png"
  },
  {
    id: "breaker_mascotte_2",
    name: "Mascotte IGNIS",
    category: "breaker",
    type: "image",
    price: 20,
    src: "../games/breaker/assets/companions/ignis/ignis_idle.png"
  },
  {
    id: "breaker_mascotte_3",
    name: "Mascotte astral",
    category: "breaker",
    type: "image",
    price: 20,
    src: "../games/breaker/assets/companions/astral/astral_idle.png"
  },
  // Attrape-les-tous
  {
    id: "attrape_mascotte_1",
    name: "Mascotte ALIA",
    category: "attrape",
    type: "image",
    price: 15,
    src: "../games/attrape/assets/images/mascotte/alia.png"
  },
  {
    id: "attrape_orbe_1",
    name: "Orbe Attrape 1",
    category: "attrape",
    type: "image",
    price: 18,
    src: "../games/attrape/assets/orbes/orb_black.png"
  },
  {
    id: "attrape_mascotte_2",
    name: "Mascotte LYRA",
    category: "attrape",
    type: "image",
    price: 15,
    src: "../games/attrape/assets/images/mascotte/lyra.png"
  }
];

function getUnlockedImages() {
  const playerData = window.CJajlkAccount && typeof window.CJajlkAccount.getPlayer === "function"
    ? window.CJajlkAccount.getPlayer()
    : {};
  return playerData.unlockedImages || {};
}

function unlockImage(imageId) {
  const playerData = window.CJajlkAccount && typeof window.CJajlkAccount.getPlayer === "function"
    ? window.CJajlkAccount.getPlayer()
    : {};
  if (!playerData.unlockedImages) playerData.unlockedImages = {};
  playerData.unlockedImages[imageId] = true;
  if (window.CJajlkAccount && typeof window.CJajlkAccount.savePlayer === "function") {
    window.CJajlkAccount.savePlayer(playerData);
  }
}

function renderImageSection(items, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const unlocked = getUnlockedImages();
  container.innerHTML = items.map(item => {
    const isUnlocked = unlocked[item.id];
    return `
      <div class="shop-image-item ${isUnlocked ? 'unlocked' : 'locked'}" data-image-id="${item.id}">
        ${isUnlocked ? '<span class="image-badge">✔</span>' : ''}
        <img src="${item.src}" alt="${item.name}" style="${isUnlocked ? '' : 'filter: blur(4px); opacity:0.6;'} width:180px; height:auto; border-radius:12px;" />
        <div class="image-info">
          <h4>${item.name}</h4>
          <span class="image-price">${item.price} CJ</span>
          ${isUnlocked ? '<span class="image-unlocked">Débloquée</span>' : `<button class="btn-buy-image" data-image="${item.id}">Acheter</button>`}
        </div>
      </div>
    `;
  }).join('');
  // Attach buy events
  container.querySelectorAll(".btn-buy-image").forEach(btn => {
    btn.addEventListener("click", () => {
      const imageId = btn.getAttribute("data-image");
      const item = items.find(i => i.id === imageId);
      if (!item) return;
      if (getCJAccountData().totalCJ < item.price) {
        showImageCJPopup("CJ insuffisants pour débloquer cette image.");
        return;
      }
      if (spendFromAccount(item.price)) {
        unlockImage(imageId);
        renderImageSections();
        showMessage("Image débloquée !");
      }
    // Popup CJ thématique pour achat image
    function showImageCJPopup(text) {
      const existing = document.querySelector('.shop-image-cj-popup');
      if (existing) existing.remove();
      const popup = document.createElement('div');
      popup.className = 'shop-image-cj-popup';
      popup.innerHTML = `
        <div class="popup-content">
          <span class="popup-icon">🌙</span>
          <span class="popup-text">${text}</span>
          <button class="popup-close">OK</button>
        </div>
      `;
      document.body.appendChild(popup);
      setTimeout(() => popup.classList.add('show'), 10);
      popup.querySelector('.popup-close').addEventListener('click', () => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
      });
    }
    });
  });
}

function renderImageSections() {
  renderImageSection(IMAGE_ITEMS.filter(i => i.category === "breaker"), "breaker-images-section");
  renderImageSection(IMAGE_ITEMS.filter(i => i.category === "attrape"), "attrape-images-section");
}

document.addEventListener('DOMContentLoaded', function() {
  renderImageSections();
});
// Activation des événements saisonniers
const ACTIVE_EVENTS = {
  easter: false,
  christmas: false
};

function disableCard(itemId) {
  const card = document.querySelector(`[data-item-id="${itemId}"]`);
  if (card) {
    card.classList.add("disabled");
    const btn = card.querySelector("button");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Indisponible";
    }
  }
}
/**
 * Met à jour dynamiquement le badge cosmétique du Hero dans la boutique
 */
function updateHeroBadge() {
  const rawBadgeId = window.CJajlkAccount && typeof window.CJajlkAccount.getSelectedBadge === "function"
    ? window.CJajlkAccount.getSelectedBadge()
    : null;
  const badgeId = typeof rawBadgeId === "string" && rawBadgeId.startsWith("badge_")
    ? rawBadgeId.slice(6)
    : rawBadgeId;
  const badgeContainer = document.getElementById("heroBadge");
  if (!badgeContainer) return;
  if (!badgeId) {
    badgeContainer.innerHTML = "";
    return;
  }
  const badgeMap = {
    explorer: { icon: "🌙", label: "Explorateur Nocturne" },
    fidele: { icon: "⭐", label: "Joueur Fidèle" },
    centre: { icon: "🔮", label: "Compagnon du Centre" }
  };
  const badge = badgeMap[badgeId];
  if (!badge) return;
  badgeContainer.innerHTML = `
    <div class="hero-badge-card glow-${badgeId}">
      <span class="badge-icon">${badge.icon}</span>
      <span class="badge-label">${badge.label}</span>
    </div>
  `;
}
/**
 * CJajlk Shop System
 * Gestion de la boutique CJ
 */

/**
 * Catalogue d'items - Phase 1 : Badges
 */
const SHOP_ITEMS = [
  {
    id: "explorer",
    name: "Explorateur Nocturne",
    description: "Badge cosmétique pour explorateurs de l'univers CJajlk.",
    price: 10,
    type: "badge",
    category: "cosmetic",
    visibleInHub: false,
    game: "global",
    icon: "🌙"
  },
  {
    id: "fidele",
    name: "Joueur Fidèle",
    description: "Badge récompensant votre fidélité à l'écosystème.",
    price: 25,
    type: "badge",
    category: "cosmetic",
    visibleInHub: false,
    game: "global",
    icon: "⭐"
  },
    {
      id: "centre",
      name: "Compagnon du Centre",
      description: "Badge exclusif des joueurs du centre CJajlk.",
      price: 50,
      type: "badge",
      category: "social",
      visibleInHub: true,
      game: "global",
      icon: "🔮",
      rankPriority: 1
    },
  {
    id: "paques",
    name: "Chasseur de Pâques",
    description: "Badge événementiel spécial Pâques.",
    price: 30,
    type: "badge",
    category: "event",
    visibleInHub: false,
    game: "global",
    icon: "🥚"
  }
];

/**
 * Récupère les données CJ officielles via CJajlkAccount
 */
function getCJAccountData() {
    if (window.CJajlkAccount && typeof window.CJajlkAccount.getTotal === "function") {
      return { totalCJ: window.CJajlkAccount.getTotal() };
    }
    return { totalCJ: 0 };
}

function spendFromAccount(amount) {
  if (!window.CJajlkAccount) return false;
  if (typeof window.CJajlkAccount.spendCJ === "function") {
    return window.CJajlkAccount.spendCJ(amount);
  }
  if (typeof window.CJajlkAccount.spend === "function") {
    return window.CJajlkAccount.spend(amount);
  }
  if (typeof window.CJajlkAccount.remove === "function") {
    return window.CJajlkAccount.remove("shop", amount);
  }
  return false;
}

/**
 * Affiche le solde CJ universel dans la boutique
 */
function updateShopBalance() {
    try {
        const account = getCJAccountData();
        const balanceEl = document.getElementById("cjAmount");
        if (balanceEl) {
            balanceEl.textContent = account.totalCJ;
        }
    } catch (error) {
        console.error("Erreur mise à jour solde CJ :", error);
    }
}

/**
 * Affiche le catalogue d'items - Phase 1 : Badges actifs
 */


function isEventActive() {
  return false; // temporaire, à adapter selon la saison
}

function renderItems(items, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const selectedBadge = window.CJajlkAccount && typeof window.CJajlkAccount.getSelectedBadge === "function" ? window.CJajlkAccount.getSelectedBadge() : null;
  const itemsHTML = items.map(item => {
    const isPurchased = window.CJajlkAccount && typeof window.CJajlkAccount.isBadgeUnlocked === "function"
      ? window.CJajlkAccount.isBadgeUnlocked(item.id)
      : false;
    const account = getCJAccountData();
    const canAfford = account.totalCJ >= item.price;
    const priceLabel = `${item.price} CJ`;
    const lockLabel = '🔒 CJ insuffisants';
    let buttonHtml = '';
    let cardClass = '';
    let disabled = false;
    // Désactive les badges event selon ACTIVE_EVENTS
    if (item.category === "event") {
      // Exemple : badge de Pâques
      if (!ACTIVE_EVENTS.easter) {
        buttonHtml = `<button class="btn-buy buy-btn disabled" disabled>Indisponible</button>`;
        disabled = true;
      }
    }
    if (!disabled) {
      if (selectedBadge === item.id) {
  cardClass = 'equipped-badge';
  if (item.category === "social") {
    cardClass += ' rank-active';
  }
  buttonHtml = '<button class="btn-equiped" disabled>Équipé</button>';
}
      else if (isPurchased) {
        buttonHtml = `<button class="btn-equip buy-btn" data-item="${item.id}" data-equip="1">Équiper</button>`;
      } else {
        buttonHtml = `<button class="btn-buy buy-btn ${!canAfford ? 'disabled' : ''}" data-item="${item.id}" data-price="${item.price}" ${!canAfford ? 'disabled' : ''}>${!canAfford ? lockLabel : 'Acheter'}</button>`;
      }
    }
    const badgeActiveLabel = (selectedBadge === item.id)
      ? '<span class="badge-active-label">Badge Actif</span>'
      : '';
    return `
      <div class="shop-item ${isPurchased ? 'purchased' : ''} ${cardClass} ${disabled ? 'disabled' : ''}" data-item-id="${item.id}">
        ${badgeActiveLabel}
        <div class="item-icon">${item.icon}</div>
        <div class="item-info">
          <h3 class="item-name">${item.name}</h3>
          <p class="item-description">${item.description}</p>
          <div class="item-footer">
            <span class="item-price">${priceLabel}</span>
            ${buttonHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');
  container.innerHTML = itemsHTML;
  // 🔥 Réattacher les events après render
  container.querySelectorAll("[data-equip='1']").forEach(btn => {
    btn.addEventListener("click", () => {
      const badgeId = btn.getAttribute("data-item");
      equipBadge(badgeId);
    });
  });

  // 🔥 Listener achat robuste
  container.querySelectorAll("[data-price]").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.disabled = true;
      const itemId = btn.getAttribute("data-item");
      const price = parseInt(btn.getAttribute("data-price"));
      // Vérifie si déjà débloqué
      if (window.CJajlkAccount && typeof window.CJajlkAccount.isBadgeUnlocked === "function" && window.CJajlkAccount.isBadgeUnlocked(itemId)) {
        renderShopCatalog();
        return;
      }
      // Vérifie les fonds
      const account = getCJAccountData();
      if (account.totalCJ < price) {
        showMessage("CJ insuffisants");
        btn.disabled = false;
        return;
      }
      // Débit sécurisé
      if (spendFromAccount(price)) {
        if (window.CJajlkAccount && typeof window.CJajlkAccount.unlockBadge === "function") {
          window.CJajlkAccount.unlockBadge(itemId);
        }
        // Si badge social → auto sélection
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (item && item.category === "social" && window.CJajlkAccount && typeof window.CJajlkAccount.setSelectedBadge === "function") {
          window.CJajlkAccount.setSelectedBadge(itemId);
        }
        showMessage("Badge débloqué !");
        renderShopCatalog();
      } else {
        btn.disabled = false;
      }
    });
  });
}

function renderShopCatalog() {
  updateShopBalance();
  // Filtrage par catégorie
  const cosmetic = SHOP_ITEMS.filter(i => i.type === "badge" && i.category === "cosmetic");
  const social = SHOP_ITEMS.filter(i => i.type === "badge" && i.category === "social");
  const event = SHOP_ITEMS.filter(i => i.type === "badge" && i.category === "event");

  renderItems(cosmetic, "cosmetic-badges");
  renderItems(social, "social-badges");
  renderItems(event, "event-badges");
}


function equipBadge(badgeId) {

  const item = SHOP_ITEMS.find(i => i.id === badgeId);
  if (!item) return;

  // Un seul badge social actif
  if (item.category === "social") {
    if (window.CJajlkAccount && typeof window.CJajlkAccount.setSelectedBadge === "function") {
      window.CJajlkAccount.setSelectedBadge(badgeId);
    }
  } else {
    if (window.CJajlkAccount && typeof window.CJajlkAccount.setSelectedBadge === "function") {
      window.CJajlkAccount.setSelectedBadge(badgeId);
    }
  }

  renderShopCatalog();
  if (typeof updateHeroBadge === "function") updateHeroBadge();
}

/**
 * Achète un item de la boutique - Phase 1 actif
 */
function buyShopItem(itemId) {
  // Empêcher le double achat
  if (window.CJajlkAccount && typeof window.CJajlkAccount.isBadgeUnlocked === "function") {
    if (window.CJajlkAccount.isBadgeUnlocked(itemId)) {
      showMessage("Badge déjà débloqué");
      return;
    }
  }
  // Trouver le prix via SHOP_ITEMS
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) {
    showMessage("Item introuvable", "error");
    return;
  }
  // Vérifier solde
  const account = getCJAccountData();
  if (account.totalCJ < item.price) {
    showMessage("CJ insuffisants", "error");
    return;
  }
  // 💳 Débiter puis débloquer le badge
  if (spendFromAccount(item.price)) {
    // 🔓 Débloque le badge
    window.CJajlkAccount.unlockBadge(itemId);

    // 👑 Auto-équipement si social
    if (item.category === "social") {
      window.CJajlkAccount.setSelectedBadge(itemId);
    }

    showMessage("Badge débloqué ! ✨");

    // 🔄 Mise à jour UI
    updateShopBalance();
    renderShopCatalog();

    // ✨ Effet visuel sur la carte
    const itemCard = document.querySelector(`[data-item-id="${itemId}"]`);
    if (itemCard) {
      itemCard.classList.add("purchase-glow");
      setTimeout(() => {
        itemCard.classList.remove("purchase-glow");
      }, 800);
    }
  }
}

/**
 * Attache les handlers d'achat sur les boutons
 */
function initShopButtons() {
  document.querySelectorAll(".buy-btn").forEach(button => {
      button.addEventListener("click", () => {
        const itemId = button.dataset.item;
        if (button.dataset.equip === "1") {
          equipBadge(itemId);
        } else {
          buyShopItem(itemId);
        }
      });
    });
}

/**
 * Affiche un message temporaire
 */
function showMessage(text, type = "info") {
  const existing = document.querySelector('.shop-message');
  if (existing) existing.remove();
  
  const message = document.createElement('div');
  message.className = `shop-message shop-message-${type}`;
  message.textContent = text;
  document.body.appendChild(message);
  
  setTimeout(() => message.classList.add('show'), 10);
  setTimeout(() => {
    message.classList.remove('show');
    setTimeout(() => message.remove(), 300);
  }, 2000);
}

/**
 * Initialise la boutique au chargement du DOM et de cjAccount.js
 */
document.addEventListener('DOMContentLoaded', function() {
  updateShopBalance();
  renderShopCatalog();
  initShopButtons();
  updateHeroBadge();
});

/**
 * [FUTUR] Réactive le rendu complet des items de la boutique
 * À utiliser quand l'écosystème CJ est totalement stabilisé
 */
function activateShopItems() {
  console.log("Activation du catalogue CJ en cours...");
  // À implémenter : rendu complet du catalogue
  console.log("Prêt pour V2.0 avec catalogue actif");
}

/**
 * Exporte les commandes pour la console (debug)
 */
window.CJajlkShop = {
  render: renderShopCatalog,
  balance: updateShopBalance,
  catalog: SHOP_ITEMS,
  activate: activateShopItems
};


