



/* =========================================================
   🌙 NOCTURNE ENGINE — CHARGEMENT DES ASSETS (images)
   ========================================================= */

export const GameAssets = {
    images: {},

    async load(list) {
        const promises = [];

        for (const key in list) {
            const img = new Image();
            img.src = list[key];

            const p = new Promise((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject("Impossible de charger " + list[key]);
            });

            GameAssets.images[key] = img;
            promises.push(p);
        }

        return Promise.all(promises);
    }
};
