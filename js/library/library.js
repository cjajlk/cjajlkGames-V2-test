import { LIBRARY_REWARD_PRICE, libraryRewards } from "./libraryData.js";
import { loadLibraryProfile, saveLibraryProfile, getLibraryUnlockedRewardIds, isRewardUnlocked, unlockLibraryReward } from "./libraryProfileAdapter.js";

let profile = null;
let unlockedRewardIds = [];
let selectedReward = null;
let purchaseInProgress = false;

function initLibrary() {
    profile = loadLibraryProfile();
    if (!profile) {
        profile = { library: { unlockedRewardIds: [] } };
        saveLibraryProfile(profile);
    }
    unlockedRewardIds = getLibraryUnlockedRewardIds(profile);
    renderLibrary();
    attachLibraryEvents();
}

function renderLibrary() {
    const total = libraryRewards.length;
    const unlockedCount = unlockedRewardIds.length;
    const progressText = document.getElementById("libraryProgressText");
    const gemText = document.getElementById("libraryGemCount");
    const gallery = document.getElementById("libraryGallery");

    if (progressText) {
        progressText.textContent = `${unlockedCount} / ${total}`;
    }
    if (gemText) {
        gemText.textContent = `💎 ${profile?.gems ?? 0}`;
    }
    if (!gallery) return;

    gallery.innerHTML = "";
    const nextLocked = libraryRewards.find(reward => !unlockedRewardIds.includes(reward.id));

    libraryRewards.forEach(reward => {
        const item = document.createElement("div");
        item.className = "library-card";
        item.dataset.rewardId = reward.id;
        const unlocked = unlockedRewardIds.includes(reward.id);
        const nextToBuy = nextLocked && nextLocked.id === reward.id;

        item.innerHTML = `
            <div class="library-card-image ${unlocked ? "unlocked" : nextToBuy ? "next" : "locked"}">
                <img src="${reward.image}" alt="${reward.title}" />
                ${unlocked ? "" : nextToBuy ? "<div class=\"library-card-label\">À acheter</div>" : "<div class=\"library-card-lock\">🔒</div>"}
            </div>
            <div class="library-card-body">
                <h3>${reward.title}</h3>
                <p>${reward.category}</p>
                ${unlocked ? "<span class=\"library-badge unlocked\">Débloqué</span>" : nextToBuy ? `<span class=\"library-badge next\">Acheter — ${reward.price} 💎</span>` : `<span class=\"library-badge locked\">Verrouillé</span>`}
            </div>
        `;

        if (unlocked || nextToBuy) {
            item.addEventListener("click", () => {
                selectedReward = reward;
                updateLibraryDetails();
            });
        }

        if (nextToBuy) {
            item.dataset.buyable = "true";
        }

        gallery.appendChild(item);
    });

    updateLibraryControls();
}

function attachLibraryEvents() {
    const backButton = document.getElementById("libraryBackButton");
    const unlockButton = document.getElementById("libraryUnlockButton");
    const detailClose = document.getElementById("libraryDetailClose");

    if (backButton) {
        backButton.addEventListener("click", () => window.location.href = "../index.html");
    }
    if (unlockButton) {
        unlockButton.addEventListener("click", buyNextReward);
    }
    if (detailClose) {
        detailClose.addEventListener("click", () => {
            selectedReward = null;
            updateLibraryDetails();
        });
    }

    const cards = document.querySelectorAll(".library-card");
    cards.forEach(card => {
        card.addEventListener("click", () => {
            const rewardId = card.dataset.rewardId;
            const reward = libraryRewards.find(r => r.id === rewardId);
            if (reward) {
                selectedReward = reward;
                updateLibraryDetails();
            }
        });
    });
}

function updateLibraryDetails() {
    const detailPane = document.getElementById("libraryDetailPane");
    const detailTitle = document.getElementById("libraryDetailTitle");
    const detailImage = document.getElementById("libraryDetailImage");
    const detailStatus = document.getElementById("libraryDetailStatus");
    const detailDescription = document.getElementById("libraryDetailDescription");

    if (!detailPane || !detailTitle || !detailImage || !detailStatus || !detailDescription) return;

    if (!selectedReward) {
        detailPane.classList.add("hidden");
        return;
    }

    detailPane.classList.remove("hidden");
    detailTitle.textContent = selectedReward.title;
    detailImage.src = selectedReward.image;
    detailImage.alt = selectedReward.title;
    detailStatus.textContent = unlockedRewardIds.includes(selectedReward.id) ? "Débloqué" : `Prix : ${selectedReward.price} 💎`;
    detailDescription.textContent = `Catégorie : ${selectedReward.category}`;
}

function updateLibraryControls() {
    const nextLocked = libraryRewards.find(reward => !unlockedRewardIds.includes(reward.id));
    const unlockButton = document.getElementById("libraryUnlockButton");
    const libraryMessage = document.getElementById("libraryMessage");

    if (nextLocked) {
        const hasEnoughGems = (profile?.gems ?? 0) >= nextLocked.price;

        if (unlockButton) {
            unlockButton.textContent = `Débloquer — ${nextLocked.price} 💎`;
            unlockButton.disabled = !hasEnoughGems;
        }
        if (libraryMessage) {
            libraryMessage.textContent = hasEnoughGems
                ? "Achetez la prochaine récompense disponible."
                : "Vous n'avez pas assez de gemmes pour acheter cette récompense.";
        }
    } else {
        if (unlockButton) {
            unlockButton.textContent = "Bibliothèque complète";
            unlockButton.disabled = true;
        }
        if (libraryMessage) {
            libraryMessage.textContent = "Bibliothèque complète";
        }
    }
}

function buyNextReward() {
    const nextLocked = libraryRewards.find(reward => !unlockedRewardIds.includes(reward.id));
    if (!nextLocked) return;
    if (purchaseInProgress) return;
    if (!profile) return;

    const currentGems = typeof profile.gems === "number" ? profile.gems : 0;
    if (currentGems < nextLocked.price) {
        const libraryMessage = document.getElementById("libraryMessage");
        if (libraryMessage) {
            libraryMessage.textContent = "Solde insuffisant. Gagnez plus de gemmes pour continuer.";
        }
        return;
    }

    purchaseInProgress = true;

    profile.gems = currentGems - nextLocked.price;
    profile = unlockLibraryReward(profile, nextLocked.id);
    unlockedRewardIds = getLibraryUnlockedRewardIds(profile);

    saveLibraryProfile(profile);
    if (typeof window.updateProfilePanel === "function") {
        window.updateProfilePanel();
    }
    if (typeof window.updateCurrenciesHUD === "function") {
        window.updateCurrenciesHUD();
    }

    renderLibrary();
    updateLibraryDetails();

    setTimeout(() => {
        purchaseInProgress = false;
    }, 500);
}

window.addEventListener("DOMContentLoaded", initLibrary);
window.initLibrary = initLibrary;
export { initLibrary, renderLibrary, buyNextReward };