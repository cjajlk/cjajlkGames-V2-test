/* =========================================================
   🌙 NOCTURNE ENGINE — DATA LOADER
   ========================================================= */

async function loadJSON(path) {
    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error("Erreur chargement : " + path);
        return await res.json();
    } catch (err) {
        console.error("❌ Impossible de charger", path, err);
        return null;
    }
}

window.GameData = {
    mascotteSkins: [],
    orbeSkins: [],
    backgrounds: [],
    packs: []
};

async function loadAllGameData() {

    const masc = await loadJSON("data/mascotte_skins.json");
    const orbs = await loadJSON("data/orb_skins.json");
    const bgs = await loadJSON("data/backgrounds.json");
    const pks = await loadJSON("data/packs.json");
    const menuChar = await loadJSON("data/menu_characters.json"); // ✅ AJOUT

    GameData.mascotteSkins = masc?.skins || [];
    GameData.orbeSkins = orbs?.orbeSkins || [];
    GameData.backgrounds = bgs?.backgrounds || [];
    GameData.packs = pks?.packs || [];
    GameData.menuCharacters = menuChar || {}; // ✅ AJOUT

    console.log("📁 Données chargées : ", GameData);
}

