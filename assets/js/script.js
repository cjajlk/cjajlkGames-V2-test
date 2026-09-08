// Helper pour attendre que l'API globale soit prête
function onCjajlkAccountReady(cb) {
  if (window.CJajlkAccount && typeof window.CJajlkAccount.getPseudo === "function") {
    cb();
  } else {
    setTimeout(() => onCjajlkAccountReady(cb), 30);
  }
}
// Affiche le pseudo sauvegardé dans la boutique au chargement
onCjajlkAccountReady(() => {
  // Supporte playerName (boutique) ou playerPseudo (hub)
  const playerNameEl = document.getElementById("playerName") || document.getElementById("playerPseudo");
  if (!playerNameEl) return;
  const pseudo = window.CJajlkAccount.getPseudo();
  if (pseudo) playerNameEl.textContent = pseudo;
});

// === Met à jour dynamiquement le badge premium du Hero depuis la boutique ===
function updateHeroBadge() {
  const badgeContainer = document.getElementById("heroBadge");
  if (!window.CJajlkAccount || !window.BADGES) return;
  const selected = window.CJajlkAccount.getSelectedBadge();
  if (badgeContainer) {
    const badgeMap = {
      badge_explorer: { icon: "🌙", label: "Explorateur Nocturne" },
      badge_fidele: { icon: "⭐", label: "Joueur Fidèle" },
      badge_centre: { icon: "🔮", label: "Compagnon du Centre" }
    };
    const badge = badgeMap[selected];
    badgeContainer.innerHTML = badge ? `
      <div class="hero-badge-card glow-${selected}">
        <span class="badge-icon">${badge.icon}</span>
        <span class="badge-label">${badge.label}</span>
      </div>
    ` : "";
  }
}

// === Gestion édition pseudo dans le hub ===
onCjajlkAccountReady(() => {
  const playerNameEl = document.getElementById("playerName");
  const editBtn = document.getElementById("editPseudoBtn");
  const modal = document.getElementById("pseudoModal");
  const input = document.getElementById("pseudoInput");
  const saveBtn = document.getElementById("savePseudoBtn");
  const cancelBtn = document.getElementById("cancelPseudoBtn");
  if (!playerNameEl || !editBtn || !modal || !input || !saveBtn || !cancelBtn) return;

  // Style premium sur bouton
  editBtn.classList.add("premium-glow");

  editBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
    input.value = "";
    input.focus();
  });

  cancelBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  saveBtn.addEventListener("click", () => {
    const newPseudo = input.value.trim();
    if (!newPseudo) return;
    if (window.CJajlkAccount) {
      window.CJajlkAccount.setPseudo(newPseudo);
      modal.classList.add("hidden");
      location.reload();
    }
  });
});

// ===== BADGES PREMIUM (source unique) =====
const BADGES = {
  explorer: {
    name: "Explorateur Nocturne",
    price: 10,
    image: "assets/badges/explorer.png"
  },
  fidele: {
    name: "Joueur Fidèle",
    price: 25,
    image: "assets/badges/fidele.png"
  },
  centre: {
    name: "Compagnon du Centre",
    price: 50,
    image: "assets/badges/centre.png"
  }
};

function showActiveBadge() {
  const selected = window.CJajlkAccount.getSelectedBadge();
  if (!selected) return;
  const badge = BADGES[selected];
  const profileCard = document.querySelector(".profile-card");
  if (!profileCard) return;
  // Supprime ancien badge si présent
  const old = profileCard.querySelector(".hub-badge");
  if (old) old.remove();
  const badgeEl = document.createElement("div");
  badgeEl.className = "hub-badge";
  badgeEl.textContent = "🌟 " + (badge ? badge.name : selected);
  profileCard.appendChild(badgeEl);
}

onCjajlkAccountReady(updateHeroBadge);

/***********************
 * CJajlk Games  Script principal
 * Version : 1.0
 * Effets : apparition douce, bascule daide, interaction jeux
 ***********************/

/* === Apparition douce au chargement === */
window.addEventListener('load', () => {
  document.body.classList.add('is-ready');
  updateCJDisplay(); // Mettre à jour le solde CJ
});

/* === Mettre à jour l'affichage du solde CJ === */
function updateCJDisplay() {
  const balanceEl = document.getElementById('cj-display-header');
  if (!balanceEl) return;

  try {
    const playerData = JSON.parse(localStorage.getItem('cjPlayerData') || '{}');
    const totalCJ = playerData.stats?.totalCJ || 0;
    balanceEl.textContent = `💎 CJ : ${totalCJ}`;
  } catch (e) {
    balanceEl.textContent = '💎 CJ : 0';
  }
}

// Mettre à jour le solde toutes les secondes (pour voir les CJ accumuler)
setInterval(updateCJDisplay, 1000);

/* === Smooth Scroll pour les ancres === */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* === Bascule de la section "Aider le dveloppeur" === */
const toggleButton = document.querySelector('.support-toggle');
const supportOptions = document.querySelector('.support-options');

if (toggleButton && supportOptions) {
  toggleButton.setAttribute('aria-expanded', 'false');
  supportOptions.setAttribute('aria-hidden', 'true');

  toggleButton.addEventListener('click', () => {
    const visible = supportOptions.classList.toggle('visible');
    toggleButton.setAttribute('aria-expanded', String(visible));
    supportOptions.setAttribute('aria-hidden', String(!visible));

    // effet sonore doux (optionnel si tu ajoutes un petit son dans assets)
    if (visible) {
      toggleButton.textContent = "Merci pour ton soutien";
    } else {
      toggleButton.textContent = "Aider le développeur";
    }
  });
}

/* === Interaction visuelle sur les cartes de jeux === */
const gameCards = document.querySelectorAll('.game-card');

gameCards.forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
    card.style.transform = 'scale(1.03)';
    card.style.boxShadow = '0 0 25px rgba(180,130,255,0.4)';
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'scale(1.0)';
    card.style.boxShadow = '0 0 15px rgba(130,90,255,0.25)';
  });
});

/* === (Optionnel) Scroll fluide vers les sections === */
const smoothLinks = document.querySelectorAll('a[href^="#"]');
smoothLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/*****************************
 * 🌙 Bêta Android – compteur manuel
 *****************************/

document.addEventListener("DOMContentLoaded", () => {

  const MAX_TESTERS = 12;
  const CURRENT_TESTERS = 7; // ← TU MODIFIES ICI

  const countText = document.getElementById("betaCountText");
  const progressBar = document.getElementById("betaProgressBar");

  if (!countText || !progressBar) {
    return;
  }

  function updateCounter() {
    countText.textContent = `${CURRENT_TESTERS} / ${MAX_TESTERS}`;
    progressBar.style.width = `${(CURRENT_TESTERS / MAX_TESTERS) * 100}%`;
  }

  updateCounter();

});

document.addEventListener("DOMContentLoaded", () => {

  const badgeImg = document.getElementById("playerBadgeImg");
  if (!badgeImg) return;
  onCjajlkAccountReady(() => {
    const data = window.CJajlkAccount.ensureDataStructure();
    const selected = window.CJajlkAccount.getSelectedBadge();
    if (selected && BADGES[selected]) {
      badgeImg.src = BADGES[selected].image;
      badgeImg.style.display = "block";
    } else {
      badgeImg.style.display = "none";
    }
  });

});
function loadBetaNames(){
  const listEl = document.getElementById("betaList");
  if (!listEl) return;

  const list = JSON.parse(localStorage.getItem("betaNames") || "[]");
  listEl.innerHTML = list.map(n => "• " + n).join("<br>");
}

function addBetaName(){
  const input = document.getElementById("betaName");
  const listEl = document.getElementById("betaList");
  if (!input || !listEl) return;

  const name = input.value.trim();

  if(!name) return;

  let list = JSON.parse(localStorage.getItem("betaNames") || "[]");

  if(!list.includes(name)){
    list.push(name);
    localStorage.setItem("betaNames", JSON.stringify(list));
  }

  input.value = "";
  loadBetaNames();
}

window.addEventListener("load", loadBetaNames);
