function loadLibraryProfile() {
    const savedProfile = localStorage.getItem("nocturnePlayerProfileV3");
    if (!savedProfile) return null;

    const profile = JSON.parse(savedProfile);
    if (!profile.library) {
        profile.library = { unlockedRewardIds: [] };
    } else if (!Array.isArray(profile.library.unlockedRewardIds)) {
        profile.library.unlockedRewardIds = [];
    }

    return profile;
}

function saveLibraryProfile(profile) {
    if (!profile || typeof profile !== "object") return;
    if (!profile.library) {
        profile.library = { unlockedRewardIds: [] };
    }

    const existingSaved = localStorage.getItem("nocturnePlayerProfileV3");
    if (existingSaved) {
        try {
            const existingProfile = JSON.parse(existingSaved);
            profile = { ...existingProfile, ...profile };
        } catch (e) {
            console.warn("Unable to merge existing profile:", e);
        }
    }

    localStorage.setItem("nocturnePlayerProfileV3", JSON.stringify(profile));
}

function getLibraryUnlockedRewardIds(profile) {
    if (!profile || !profile.library || !Array.isArray(profile.library.unlockedRewardIds)) {
        return [];
    }
    return profile.library.unlockedRewardIds;
}

function isRewardUnlocked(profile, rewardId) {
    const ids = getLibraryUnlockedRewardIds(profile);
    return ids.includes(rewardId);
}

function unlockLibraryReward(profile, rewardId) {
    if (!profile || typeof profile !== "object") return profile;
    if (!profile.library) profile.library = { unlockedRewardIds: [] };
    if (!Array.isArray(profile.library.unlockedRewardIds)) {
        profile.library.unlockedRewardIds = [];
    }
    if (!profile.library.unlockedRewardIds.includes(rewardId)) {
        profile.library.unlockedRewardIds.push(rewardId);
    }
    return profile;
}

export { loadLibraryProfile, saveLibraryProfile, getLibraryUnlockedRewardIds, isRewardUnlocked, unlockLibraryReward };