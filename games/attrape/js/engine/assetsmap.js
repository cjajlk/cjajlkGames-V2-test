window.GameAssets = window.GameAssets || {
    images: {},

    async load(assetList) {
        if (!Array.isArray(assetList) || assetList.length === 0) return;

        await Promise.all(assetList.map(asset => {
            return new Promise(resolve => {
                if (!asset || !asset.id || !asset.src) {
                    resolve();
                    return;
                }

                const img = new Image();
                img.onload = () => {
                    window.GameAssets.images[asset.id] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.error("Impossible de charger :", asset.src);
                    resolve();
                };
                img.src = asset.src;
            });
        }));
    }
};

function buildAssetsMap(GameData) {

    const mascotte =
        GameData.mascotteSkins.find(m => m.id === equippedMascotte) ||
        GameData.mascotteSkins[0];

    const orbe =
        GameData.orbeSkins.find(o => o.id === equippedOrb) ||
        GameData.orbeSkins[0];

    const bg =
        GameData.backgrounds[currentBackgroundIndex] ||
        GameData.backgrounds[0];

    const menuLyra = GameData.menuCharacters?.lyra || {};
    const menuOrb  = GameData.menuCharacters?.orb  || {};

    const assets = [
        { id: "background", src: bg.img },
        { id: "orb", src: orbe.img },

        // ✨ Aura (orbe équipée)
        { id: "orb_aura", src: "assets/item/aura.png" },

        { id: "mascotte", src: mascotte.img },

        { id: "menuMascotteIdle",  src: menuLyra.idle  },
        { id: "menuMascotteBlink", src: menuLyra.blink },
        { id: "menuMascotteBreath", src: menuLyra.breath },
        { id: "menuMascottePulse",  src: menuLyra.pulse }
    ];

    // 🔥 AJOUT ICI : chargement automatique des sprites de mascotte
    GameData.mascotteSkins.forEach(skin => {

        if (skin.img_idle)
            assets.push({ id: skin.id + "_idle", src: skin.img_idle });

        if (skin.img_blink)
            assets.push({ id: skin.id + "_blink", src: skin.img_blink });

        if (skin.img_happy)
            assets.push({ id: skin.id + "_happy", src: skin.img_happy });

        if (skin.img_sad)
            assets.push({ id: skin.id + "_sad", src: skin.img_sad });
    });

    return assets;
}




