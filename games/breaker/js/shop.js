document.addEventListener('DOMContentLoaded', () => {
    loadShopData();
    updateCurrencyDisplay();
    setupBackButton();
    document.addEventListener('languagechange', () => {
        displayCategory('companions');
        updateCurrencyDisplay();
    });
});

let shopData = {};

const getLang = () => (window.I18n ? window.I18n.getLanguage() : 'fr');

async function loadShopData() { 
    try {
        const response = await fetch('../data/shopData.json');
        shopData = await response.json();
        displayCategory('companions');
    } catch (error) {
        console.error('Error loading shop data:', error);
    }
}

function displayCategory(categoryName) {
    const category = shopData.categories.find(cat => (cat.id || '').toLowerCase() === categoryName)
        || shopData.categories.find(cat => (cat.name && typeof cat.name === 'string') && cat.name.toLowerCase() === categoryName);
    if (!category) return;

    const itemsGrid = document.getElementById('items-grid');
    itemsGrid.innerHTML = '';

    category.items.forEach(item => {
        const itemElement = createItemElement(item);
        itemsGrid.appendChild(itemElement);
    });
}

function createItemElement(item) {
    const profile = getPlayerProfile();
    const isOwned = profile.unlockedCompanions && profile.unlockedCompanions.includes(item.id);
    const canAfford = profile.diamants >= item.price;

    const lang = getLang();
    const itemDiv = document.createElement('div');
    itemDiv.className = `item ${item.rarity}`;
    if (isOwned) itemDiv.classList.add('owned');

    // Badge de rareté
    const rarityBadge = document.createElement('div');
    rarityBadge.className = 'rarity-badge';
    const rarityLabel = i18nT(`shop.rarity.${item.rarity}`);
    rarityBadge.textContent = rarityLabel !== `shop.rarity.${item.rarity}` ? rarityLabel : item.rarity.toUpperCase();
    itemDiv.appendChild(rarityBadge);

    // Badge OWNED
    if (isOwned) {
        const ownedBadge = document.createElement('div');
        ownedBadge.className = 'owned-badge';
        ownedBadge.textContent = i18nT('shop.ownedBadge');
        itemDiv.appendChild(ownedBadge);
    }

    // Container visuel (image ou 3D)
    const imgContainer = document.createElement('div');
    imgContainer.className = 'img-container';
    const itemName = typeof item.name === 'object' ? item.name[lang] || item.name.fr : item.name;
    const itemDesc = typeof item.description === 'object' ? item.description[lang] || item.description.fr : item.description;

    const glbUrl = item.glb || item.gbl;
    if (glbUrl) {
        // Affichage 3D avec <model-viewer>
        const modelViewer = document.createElement('model-viewer');
        // Si chemin absolu, on l'utilise tel quel, sinon on préfixe
        const src = glbUrl.startsWith('/') ? glbUrl : `../${glbUrl}`;
        modelViewer.setAttribute('src', src);
        modelViewer.setAttribute('alt', itemName);
        modelViewer.setAttribute('auto-rotate', '');
        modelViewer.setAttribute('camera-controls', '');
        modelViewer.setAttribute('interaction-prompt', 'none');
        modelViewer.className = 'shop-model';
        imgContainer.appendChild(modelViewer);
    } else {
        const img = document.createElement('img');
        img.src = `../${item.image}`;
        img.alt = itemName;
        if (!isOwned && item.price > 0) {
            img.classList.add('locked');
        }
        imgContainer.appendChild(img);
    }

    // Lock icon si non débloqué
    if (!isOwned && item.price > 0) {
        const lockIcon = document.createElement('div');
        lockIcon.className = 'lock-icon';
        lockIcon.textContent = '🔒';
        imgContainer.appendChild(lockIcon);
    }
    itemDiv.appendChild(imgContainer);

    // Correction : déclaration de costDiv
    const costDiv = document.createElement('div');
    costDiv.className = 'cost';
    costDiv.textContent = item.price === 0 ? i18nT('shop.free') : item.price;

    const buyBtn = document.createElement('button');
    buyBtn.className = 'purchase-btn';
    
    if (isOwned) {
        buyBtn.textContent = i18nT('shop.owned');
        buyBtn.disabled = true;
        buyBtn.classList.add('owned-btn');
    } else if (!canAfford && item.price > 0) {
        buyBtn.textContent = i18nT('shop.notEnough');
        buyBtn.disabled = true;
        buyBtn.classList.add('disabled-btn');
    } else {
        buyBtn.textContent = item.price === 0 ? i18nT('shop.unlock') : i18nT('shop.purchase');
        buyBtn.onclick = (e) => {
            e.stopPropagation();
            showPurchaseModal(item);
        };
    }
    
    // Click sur la carte pour preview
    itemDiv.onclick = () => showPreviewModal(item, isOwned);

    // Correction : déclaration de nameDiv et descDiv
    const nameDiv = document.createElement('div');
    nameDiv.className = 'name';
    nameDiv.textContent = itemName;

    const descDiv = document.createElement('div');
    descDiv.className = 'description';
    descDiv.textContent = itemDesc;

    itemDiv.appendChild(nameDiv);
    itemDiv.appendChild(descDiv);
    itemDiv.appendChild(costDiv);
    itemDiv.appendChild(buyBtn);

    return itemDiv;
}

function showPreviewModal(item, isOwned) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const profile = getPlayerProfile();
    const canAfford = profile.diamants >= item.price;
    
    const lang = getLang();
    const itemName = typeof item.name === 'object' ? item.name[lang] || item.name.fr : item.name;
    const itemDesc = typeof item.description === 'object' ? item.description[lang] || item.description.fr : item.description;
    const rarityLabel = i18nT(`shop.rarity.${item.rarity}`);
    
    const glbUrl = item.glb || item.gbl;
    modal.innerHTML = `
        <div class="modal-content preview-modal ${item.rarity}">
            <button class="modal-close">×</button>
            <div class="modal-header">
                <h2>${itemName}</h2>
                <span class="rarity-badge-large">${rarityLabel !== `shop.rarity.${item.rarity}` ? rarityLabel : item.rarity.toUpperCase()}</span>
            </div>
            <div class="modal-body">
                <div class="preview-image-container">
                    ${glbUrl ?
                        `<model-viewer src="../${glbUrl}" alt="${itemName}" auto-rotate camera-controls interaction-prompt="none" class="shop-model"></model-viewer>` :
                        `<img src="../${item.image}" alt="${itemName}" class="preview-image">`
                    }
                    ${!isOwned && item.price > 0 ? '<div class="preview-lock">🔒</div>' : ''}
                </div>
                <p class="preview-description">${itemDesc}</p>
                <div class="preview-price">
                    ${isOwned ? `<span class="owned-text">${i18nT('shop.ownedText')}</span>` : 
                        item.price === 0 ? `<span class="free-text">${i18nT('shop.free')}</span>` :
                        `<span class="price-text">${i18nT('shop.priceText', { price: item.price })}</span>`}
                </div>
            </div>
            <div class="modal-footer">
                ${!isOwned ? `
                    <button class="modal-btn cancel-btn" onclick="this.closest('.modal-overlay').remove()">${i18nT('shop.cancel')}</button>
                    <button class="modal-btn purchase-btn-modal ${!canAfford && item.price > 0 ? 'disabled' : ''}" 
                            ${!canAfford && item.price > 0 ? 'disabled' : ''}
                            onclick="confirmPurchase('${item.id}')">
                        ${item.price === 0 ? i18nT('shop.unlock') : i18nT('shop.purchase')}
                    </button>
                ` : `
                    <button class="modal-btn close-btn" onclick="this.closest('.modal-overlay').remove()">${i18nT('shop.close')}</button>
                `}
            </div>
        </div>
    `;
    
    modal.querySelector('.modal-close').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    document.body.appendChild(modal);
}

function showPurchaseModal(item) {
    showPreviewModal(item, false);
}

function confirmPurchase(itemId) {
    const category = shopData.categories.find(cat => (cat.id || '').toLowerCase() === 'companions')
        || shopData.categories.find(cat => (cat.name && typeof cat.name === 'string') && cat.name.toLowerCase() === 'mascots');
    const item = category.items.find(i => i.id === itemId);
    
    if (purchaseItem(item)) {
        document.querySelector('.modal-overlay').remove();
    }
}

function purchaseItem(item) {
    const profile = getPlayerProfile();
    
    if (profile.diamants >= item.price) {
        console.log("🛒 Purchasing:", item.id, "for", item.price, "diamants");
        console.log("💎 Before purchase - Diamants:", profile.diamants, "Unlocked:", profile.unlockedCompanions);
        
        profile.diamants -= item.price;
        
        if (!profile.unlockedCompanions) profile.unlockedCompanions = [];
        if (!profile.unlockedCompanions.includes(item.id)) {
            profile.unlockedCompanions.push(item.id);
        }
        
        savePlayerProfile(profile);
        
        // Vérification
        const verified = getPlayerProfile();
        console.log("✅ After purchase - Diamants:", verified.diamants, "Unlocked:", verified.unlockedCompanions);
        updateCurrencyDisplay();
        
        const lang = getLang();
        const itemName = typeof item.name === 'object' ? item.name[lang] || item.name.fr : item.name;
        showToast(i18nT('shop.unlockedSuccess', { name: itemName }), 'success');
        
        // Refresh display
        displayCategory('companions');
        
        return true;
    } else {
        showToast(`💎 ${i18nT('shop.notEnough')}`, 'error');
        return false;
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateCurrencyDisplay() {
    const profile = getPlayerProfile();
    const diamondCount = document.getElementById('diamond-count');
    if (diamondCount) {
        diamondCount.textContent = profile.diamants || 0;
    }
}

function setupBackButton() {
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.onclick = () => window.location.href = '../pages/mainmenu.html';
    }
}

// Category switching
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('category-btn')) {
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        displayCategory(e.target.dataset.category);
    }
});
