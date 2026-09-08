/* Launch/test pricing: change PIECE_PRICE_CJ here, never in the wallet. */
(() => {
  'use strict';
  const PIECE_PRICE_CJ = 2;
  const collections = [
    { id: 'plage_volley', title: 'Plage & volley', subtitle: 'Un moment de jeu sous le soleil.', file: 'collection_plage_volley.png', icon: '☀' },
    { id: 'foret_enchantee', title: 'Forêt enchantée', subtitle: 'Un refuge caché au cœur de la forêt.', file: 'collection_foret_enchantee.png', icon: '❋' },
    { id: 'voyage_cosmique', title: 'Voyage cosmique', subtitle: 'Une aventure au-delà des étoiles.', file: 'collection_voyage_cosmique.png', icon: '✧' }
  ].map(item => Object.freeze({ ...item, backgroundId: `collection_${item.id}`, src: `../assets/images/collections/${item.file}` }));
  window.CJCollectionsConfig = Object.freeze({ piecePriceCJ: PIECE_PRICE_CJ, pieces: 4, columns: 2, collections: Object.freeze(collections) });
  for (const item of collections) window.CJProfileCatalog.register({ id: item.backgroundId, type: 'background', label: item.title, src: item.src });
})();
