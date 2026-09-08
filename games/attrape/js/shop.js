/* =========================================================
   🌙 BOUTIQUE NOCTURNE — CURRENCIES & STATE
   ========================================================= */

// Monnaies
let coins = parseInt(localStorage.getItem("coins") || "0", 10);   // points pour skins de base
let gems  = parseInt(localStorage.getItem("gems")  || "0", 10);   // gemmes pour premium

// 🔁 Compat: ancienne clé "equippedOrbe" -> nouvelle "equippedOrb"
const storedEquippedOrb = localStorage.getItem("equippedOrb");
const oldEquippedOrbe = localStorage.getItem("equippedOrbe");
const needsOrbMigration = !storedEquippedOrb && !!oldEquippedOrbe;


// Possessions
let ownedMascotte    = JSON.parse(localStorage.getItem("ownedMascotte"))    || ["girl1"];
let ownedOrbs        = JSON.parse(localStorage.getItem("ownedOrbs"))        || ["orb_blue"];
let ownedBackgrounds = JSON.parse(localStorage.getItem("ownedBackgrounds")) || ["normal1"];
let ownedPacks       = JSON.parse(localStorage.getItem("ownedPacks"))       || [];

// Équipés
let equippedMascotte   = localStorage.getItem("equippedMascotte")   || "girl1";
let equippedOrb        = storedEquippedOrb || oldEquippedOrbe || "orb_blue";
let equippedBackground = localStorage.getItem("equippedBackground") || "normal1";
let equippedTheme      = localStorage.getItem("equippedTheme") || equippedBackground;

// Onglet courant
let selectedTab = "mascotte";

// Exposition pour game.js
window.equippedMascotte   = equippedMascotte;
window.equippedOrb        = equippedOrb;
window.equippedBackground = equippedBackground;

if (needsOrbMigration && typeof savePlayerProfile === "function") {
    savePlayerProfile();
}


/* =========================================================
   💎 / 🪙 HUD CURRENCIES
   ========================================================= */
function updateCurrenciesHUD() {
    const hudCoins = document.getElementById("hudCoins");
    const hudGems = document.getElementById("hudGems");

    if (hudCoins) {
        hudCoins.textContent = `💰 Coins: ${coins}`;  // Affiche les coins
        console.log("Coins affichés:", coins);
    }

    if (hudGems) {
      hudGems.textContent = "💎 " + (gems ?? 0);
 
        console.log("Gems affichés:", gems);
    }

    // Optionnel : compteur dans la boutique
    const shopGems = document.getElementById("shopGems");
    if (shopGems) {
        shopGems.textContent = `💎 ${gems}`;
    }
}

window.addCoins = function(amount) {
    coins = Math.max(0, coins + amount);
    savePlayerProfile();  // Sauvegarde les nouvelles données
    updateCurrenciesHUD();
    updateProfilePanel(); 
    console.log("Coins après mise à jour:", coins);
};

window.addGems = function(amount) {
    gems = Math.max(0, gems + amount);
    savePlayerProfile();  // Sauvegarde les nouvelles données
    updateCurrenciesHUD();  // Mise à jour du HUD
    updateProfilePanel();   // Mise à jour du profil
    console.log("Gems mis à jour :", gems); // Affiche les gemmes dans la console
}




// Après chaque mise à jour des coins ou gems
updateCurrenciesHUD();




/* =========================================================
   🌙 INIT SHOP — appelé après loadAllGameData()
   ========================================================= */


   function updateShopCoins() {
    const el = document.getElementById("shopCoins");
    if (el) el.textContent = "💰 " + coins;
}

function initShop() {
    console.log("🟣 initShop() lancé");

    // Bouton fermer
    const closeBtn = document.getElementById("closeShop");
    if (closeBtn) closeBtn.addEventListener("click", closeShop);

    // Onglets
    const tabs = document.querySelectorAll(".tab-btn");
    console.log("🔍 Boutons d’onglet trouvés :", tabs.length);

    tabs.forEach(btn => {
        btn.addEventListener("click", () => {
            tabs.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedTab = btn.dataset.tab || "mascotte";
            updateShop();
        });
    });

    updateCurrenciesHUD();
    updateShop();
}
window.initShop = initShop;


/* =========================================================
   🪟 OUVERTURE / FERMETURE SHOP
   ========================================================= */

function openShop() {
    const ov = document.getElementById("shopOverlay");
    if (!ov) return;
    ov.classList.remove("hidden");
    ov.classList.add("visible");
    if (typeof window.syncHudVisibility === "function") window.syncHudVisibility();
    updateShop();
    updateShopCoins();

}
window.openShop = openShop;

function closeShop() {
    const ov = document.getElementById("shopOverlay");
    if (!ov) return;
    ov.classList.remove("visible");
    ov.classList.add("hidden");
    if (typeof window.syncHudVisibility === "function") window.syncHudVisibility();
}

window.closeShop = closeShop;   // ← IMPORTANT !!






/* =========================================================
   🔁 UPDATE SHOP (selon l’onglet)
   ========================================================= */

function updateShop() {
    if (!window.GameData || !GameData.mascotteSkins) {
        console.warn("⚠ GameData non chargé, impossible de remplir la boutique.");
        return;
    }

    const root = document.getElementById("shopContent");
    if (!root) return;

    root.innerHTML = "";

    if (selectedTab === "mascotte") return renderMascotteShop(root);
    if (selectedTab === "orbes")    return renderOrbeShop(root);
    if (selectedTab === "packs")    return renderPackShop(root);
    if (selectedTab === "fonds")    return renderBackgroundShop(root);

    let priceText = "";



}


/* =========================================================
   🧩 OUTILS D’AFFICHAGE
   ========================================================= */

function createSection(title) {
    const section = document.createElement("div");
    section.className = "shop-section";

    const h = document.createElement("h3");
    h.className = "shop-section-title";
    h.textContent = title;

    section.appendChild(h);
    return section;
}

function getPriceLabel(item) {
    const cCoins = item.costCoins || 0;
    const cGems  = item.costGems  || 0;

    const parts = [];
    if (cCoins > 0) parts.push(`${cCoins} pts`);
    if (cGems  > 0) parts.push(`${cGems} 💎`);

    if (!parts.length) return "Gratuit";
    return parts.join(" + ");
}

function getButtonLabel(item, type) {
    let owned = false;
    let equipped = false;

    if (type === "mascotte") {
        owned = ownedMascotte.includes(item.id);
        equipped = (equippedMascotte === item.id);

    } else if (type === "orbe") {
        owned = ownedOrbs.includes(item.id);
        equipped = (equippedOrb === item.id);

    }else if (type === "background") {
    owned = ownedBackgrounds.includes(item.id);
    equipped = (equippedBackground === item.id);
}


    // 1) déjà équipé
    if (equipped) return "Équipé ✓";

    // 2) déjà acheté → simple équipement
    if (owned) return "Équiper";

    // 3) pas encore acheté → afficher le prix
    const costCoins = item.costCoins || 0;
    const costGems  = item.costGems  || 0;

    if (costCoins === 0 && costGems === 0) {
        return "Gratuit";
    }

    const parts = [];
    if (costCoins > 0) parts.push(`${costCoins} pts`);
    if (costGems  > 0) parts.push(`${costGems} 💎`);

    return `Acheter (${parts.join(" + ")})`;
}


function createSkinCard(item, type) {
    const card = document.createElement("div");
    card.className = "shop-item";

    const img = document.createElement("img");
    img.src = item.img;
    img.alt = item.name;
    card.appendChild(img);

    const title = document.createElement("h4");
    title.textContent = item.name;
    card.appendChild(title);

    const price = document.createElement("p");
    price.className = "shop-price";
    price.textContent = getButtonLabel(item, type);
    card.appendChild(price);

    if (type === "orbe" && item.bonus) {
        const bonus = document.createElement("p");
        bonus.className = "shop-bonus";
        bonus.textContent = item.bonus;
        card.appendChild(bonus);
    }

    const btn = document.createElement("button");
    btn.className = "shop-buy-btn";
    btn.textContent = getButtonLabel(item, type);

    btn.addEventListener("click", () => {
        const label = getButtonLabel(item, type);

        // ----- ÉQUIPEMENT DIRECT -----
        if (label === "Équiper") {
            if (type === "mascotte") {
                equippedMascotte = item.id;
                window.equippedMascotte = equippedMascotte;
            } else {
               equippedOrb = item.id;
                window.equippedOrb = equippedOrb;
            }
            savePlayerProfile();
            updateShop();
            return;
        }

        // ----- ACHAT -----
        if (label.startsWith("Acheter")) {
            handlePurchase(item, type);
            return;
        }
    });

    card.appendChild(btn);
    return card;
}

 


        



/* =========================================================
   🎀 ONGLET MASCOTTE
   ========================================================= */
function renderMascotteShop(root) {
    const skins = GameData.mascotteSkins || [];

    const secNormal  = createSection("Skins classiques");
    const secPremium = createSection("Skins premium");
    const secNoel    = createSection("Édition Noël");

    skins.forEach(skin => {

          // 🎄 Mascotte désactivée (événement terminé)
  if (skin.disabled) return;

       // 🔒 Mascotte réservée à un pack non possédé
if (skin.packOnly && !ownedPacks.includes(skin.packOnly)) {
    return;
}


        const card = createSkinCard(skin, "mascotte");
        const cat = skin.category || "normal";

        if (cat === "normal") secNormal.appendChild(card);
        else if (cat === "premium") secPremium.appendChild(card);
        else if (cat === "noel") secNoel.appendChild(card);
    });

    [secNormal, secPremium, secNoel].forEach(sec => {
        if (sec.children.length > 1) root.appendChild(sec);
    });
}


/* =========================================================
   🟣 ONGLET ORBES
   ========================================================= */

function renderOrbeShop(root) {
    const orbs = GameData.orbeSkins || [];

    const secBase  = createSection("Orbes standards");
    const secBonus = createSection("Orbes bonus / spéciales");

    orbs.forEach(orb => {


         // 🎄 Orbe désactivée (événement terminé)
  if (orb.disabled) return;

        const card = createSkinCard(orb, "orbe");
        if (orb.bonus && orb.bonus !== "Aucun") {
            secBonus.appendChild(card);
        } else {
            secBase.appendChild(card);
        }
    });

    if (secBase.children.length  > 1) root.appendChild(secBase);
    if (secBonus.children.length > 1) root.appendChild(secBonus);
}


/* =========================================================
   🎁 ONGLET PACKS
   ========================================================= */

function renderPackShop(root) {
    const packs = GameData.packs || [];

    if (!packs.length) {
        const msg = document.createElement("p");
        msg.className = "shop-empty";
        msg.textContent = "Aucun pack disponible pour le moment.";
        root.appendChild(msg);
        return;
    }

    packs.forEach(pack => {
        const alreadyOwned = ownedPacks.includes(pack.id);
        const isEventPack = !!pack.eventId;
        const isEventActive = isEventPack && window.EventManager
            ? EventManager.isEventActive(pack.eventId)
            : true;

        // Packs non-evenement desactives restent caches si non possedes
        if (!isEventPack && pack.disabled && !alreadyOwned) {
            return;
        }

        const card = document.createElement("div");
        card.className = "shop-pack";

        const header = document.createElement("div");
        header.className = "pack-header";

        const img = document.createElement("img");
        img.className = "pack-img";
        img.src = pack.img || "";
        img.alt = pack.name;
        header.appendChild(img);

        const info = document.createElement("div");
        info.className = "pack-info";

        const title = document.createElement("h4");
        title.textContent = pack.name;
        info.appendChild(title);

        if (pack.description) {
            const desc = document.createElement("p");
            desc.className = "pack-desc";
            desc.textContent = pack.description;
            info.appendChild(desc);
        }

        const contents = [];
        if (pack.items) {
            if (Array.isArray(pack.items.mascotte) && pack.items.mascotte.length)
                contents.push(pack.items.mascotte.length + " mascottes");
            if (Array.isArray(pack.items.orbes) && pack.items.orbes.length)
                contents.push(pack.items.orbes.length + " orbes");
            if (Array.isArray(pack.items.backgrounds) && pack.items.backgrounds.length)
                contents.push(pack.items.backgrounds.length + " fonds");
        }
        if (contents.length) {
            const summary = document.createElement("p");
            summary.className = "pack-contents";
            summary.textContent = contents.join(" • ");
            info.appendChild(summary);
        }

        const price = document.createElement("p");
        price.className = "pack-price";

        const cCoins = pack.costCoins || 0;
        const cGems  = pack.costGems  || 0;
        if (cCoins === 0 && cGems === 0) {
            price.textContent = "Gratuit";
        } else {
            const parts = [];
            if (cCoins > 0) parts.push(`${cCoins} pts`);
            if (cGems  > 0) parts.push(`${cGems} 💎`);
            price.textContent = parts.join(" + ");
        }
        info.appendChild(price);

        header.appendChild(info);
        card.appendChild(header);

        if (pack.limited) {
            const tag = document.createElement("span");
            tag.className = "pack-tag-limited";
            tag.textContent = "Édition limitée";
            card.appendChild(tag);
        }

        if (alreadyOwned) {
            const tag = document.createElement("span");
            tag.className = "pack-tag-owned";
            tag.textContent = "✓ Débloqué";
            card.appendChild(tag);
        } else if (isEventPack && !isEventActive) {
            const tag = document.createElement("span");
            tag.className = "pack-tag-inactive";
            tag.textContent = "Hors saison";
            tag.title = "Disponible pendant l'événement";
            card.appendChild(tag);
        }

        const btn = document.createElement("button");
        btn.className = "shop-buy-btn";

        if (alreadyOwned) {
            btn.textContent = "Débloqué ✓";
            btn.disabled = true;
        } else if (isEventPack && !isEventActive) {
            btn.textContent = "Hors saison";
            btn.disabled = true;
            btn.title = "Disponible pendant l'événement";
        } else {
            btn.textContent = "Obtenir";
        }

        btn.addEventListener("click", () => {
            if (alreadyOwned) return;
            if (isEventPack && !isEventActive) return;

            const needCoins = cCoins;
            const needGems  = cGems;

            // 🔒 Sécurité monnaie avec popup
if (coins < needCoins || gems < needGems) {
    const type = (coins < needCoins) ? "points" : "gemmes";
    showGemNotEnoughPopup(type);
    return;
}


           
            coins -= needCoins;
            gems  -= needGems;
            updateCurrenciesHUD();

            unlockPackItems(pack);

            ownedPacks.push(pack.id);
            savePlayerProfile();

            

            updateShop();
        });

        card.appendChild(btn);
        root.appendChild(card);
    });
}

/* =========================================
   🎨 FONDS — Boutique (étape 1 simple)
========================================= */

function renderBackgroundShop(root) {

  


    // 🌿 1. Données des fonds
    const backgrounds =  [];



    // 🌿 2. Structure HTML principale
    root.innerHTML = `
        <div class="shop-section">
            <h2>🎨 Fonds disponibles</h2>
            <div class="shop-grid"></div>
         <p class="shop-soon">En cours de préparation… ✨</p>



        </div>
    `;

    const grid = root.querySelector(".shop-grid");


    // 🌿 3. Création des cartes
    backgrounds.forEach(bg => {

        const card = document.createElement("div");
        card.className = "shop-card";

       const isEquipped = localStorage.getItem("equippedTheme") === bg.id;



     let priceText = "";

if (bg.costCoins > 0)
    priceText += bg.costCoins + " 💰 ";

if (bg.costGems > 0)
    priceText += bg.costGems + " 💎 ";




card.innerHTML = `
    <img src="${bg.img}" class="shop-card-img">
    <h3>${bg.name}</h3>

    ${!isEquipped ? `<div class="shop-price">${priceText}</div>` : ""}

    <button class="shop-btn ${isEquipped ? 'equipped' : ''}">
        ${isEquipped ? "Équipé ✓" : "Équiper"}
    </button>
`;



        // 🔥 IMPORTANT : récupérer le bouton APRÈS innerHTML
        const btn = card.querySelector(".shop-btn");

     btn.onclick = () => {

    const owned = ownedBackgrounds.includes(bg.id);

    // ========================
    // PAS ACHETÉ → PAYER
    // ========================
    if (!owned) {

        if (coins < bg.costCoins) {
    showGemNotEnoughPopup("points");
    return;
}

if (gems < bg.costGems) {
    showGemNotEnoughPopup("gemmes");
    return;
}


        coins -= bg.costCoins;
        gems  -= bg.costGems;

        ownedBackgrounds.push(bg.id);
    }

    // ========================
    // ÉQUIPER (seulement si possédé)
    // ========================
    equippedBackground = bg.id;
    window.equippedBackground = equippedBackground;
    savePlayerProfile();

    applyTheme(bg);
    updateShop();
};



 



        grid.appendChild(card);
    });
}
 
function applyTheme(bg) {
   
     Game.currentBackgroundId = bg.id;

    equippedTheme = bg.id;
    savePlayerProfile();

    const img = new Image();
    img.src = bg.img;

    if (window.State && State.assets) {
        State.assets.background = img;
    }

    // ⭐ 1. Nettoyer toutes les classes effets
    document.body.classList.remove(
        "bg-ocean",
        "bg-forest",
        "bg-neon",
        "bg-futur",
        "bg-snow"
    );

    // ⭐ 2. Ajouter seulement celle du fond choisi
    if (bg.id === "manga12") {
        document.body.classList.add("bg-ocean");
    }

    if (window.Renderer && Renderer.renderFrame) {
        Renderer.renderFrame();
    }
}






function unlockPackItems(pack) {
    if (!pack.items) return;

    if (Array.isArray(pack.items.mascotte)) {
        pack.items.mascotte.forEach(id => {
            if (!ownedMascotte.includes(id)) ownedMascotte.push(id);
        });
    }

    if (Array.isArray(pack.items.orbes)) {
        pack.items.orbes.forEach(id => {
            if (!ownedOrbs.includes(id)) ownedOrbs.push(id);
        });
    }

    if (Array.isArray(pack.items.backgrounds)) {
        pack.items.backgrounds.forEach(id => {
            if (!ownedBackgrounds.includes(id)) ownedBackgrounds.push(id);
        });
    }
}



/* =========================================================
   💰 ACHATS / ÉQUIPEMENT (SKINS)
   ========================================================= */

// Fonction gérant les achats et l'équipement
function handlePurchase(item, type) {

    // Déjà possédé → ne pas acheter, juste équiper
    if (type === "mascotte" && ownedMascotte.includes(item.id)) {
        equippedMascotte = item.id;
        window.equippedMascotte = equippedMascotte;
        savePlayerProfile();
        updateShop();
        return;
    }

    if (type === "orbe" && ownedOrbs.includes(item.id)) {
        equippedOrb = item.id;
        window.equippedOrb = equippedOrb;
        savePlayerProfile();
        updateShop();
        return;
    }

    // --- Achat normal ---
    const costCoins = item.costCoins || 0;
    const costGems  = item.costGems  || 0;

    // Vérifier les points
    if (costCoins > 0 && coins < costCoins) {
        // Afficher un popup si pas assez de points
        showGemNotEnoughPopup("points");
        return;
    }

    // Vérifier les gemmes
    if (costGems > 0 && gems < costGems) {
        // Afficher un popup si pas assez de gemmes
        showGemNotEnoughPopup("gemmes");
        return;
    }

    // Paiement : Déduire les points et les gemmes
    coins -= costCoins;
    gems  -= costGems;

    updateCurrenciesHUD();

    // Enregistrer ownership
    if (type === "mascotte") {
        if (!ownedMascotte.includes(item.id)) {
            ownedMascotte.push(item.id);
        }

        equippedMascotte = item.id;
        window.equippedMascotte = equippedMascotte;
    }

    if (type === "orbe") {
        if (!ownedOrbs.includes(item.id)) {
            ownedOrbs.push(item.id);
        }

        equippedOrb = item.id;
        window.equippedOrb = equippedOrb;
    }

    savePlayerProfile();
    updateShop();
}




// Fonction pour afficher le popup "Pas assez de gemmes" ou "Pas assez de points"
function showGemNotEnoughPopup(type) {
    const popupElement = document.getElementById("gemNotEnoughPopup");

    if (!popupElement) {
        console.error("❌ Popup gemNotEnoughPopup introuvable dans le DOM !");
        return;
    }

    const message = type === "points" 
        ? "Vous n'avez pas assez de points pour cet achat !" 
        : "Vous n'avez pas assez de gemmes pour cet achat !";

    const messageElement = popupElement.querySelector("p");
    messageElement.textContent = message;

    // Ajouter la classe visible pour afficher le popup
    popupElement.classList.remove("hidden");
    popupElement.classList.add("visible");
}

function closeGemPopup() {
    const popupElement = document.getElementById("gemNotEnoughPopup");
    popupElement.classList.remove("visible");  // Masquer le popup en enlevant "visible"
    popupElement.classList.add("hidden");  // Ajouter la classe "hidden" à nouveau
}


