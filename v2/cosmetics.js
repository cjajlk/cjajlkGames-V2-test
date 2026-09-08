/* Metadata only; acquisition stays in the existing account. */
(() => {
  'use strict';
  const entries = [
    ['breaker_mascotte_1', 'Aqua', '../games/breaker/assets/companions/aqua/aqua_idle.png'],
    ['breaker_mascotte_2', 'Ignis', '../games/breaker/assets/companions/ignis/ignis_idle.png'],
    ['breaker_mascotte_3', 'Astral', '../games/breaker/assets/companions/astral/astral_idle.png'],
    ['attrape_mascotte_1', 'Alia', '../games/attrape/assets/images/mascotte/alia.png'],
    ['attrape_mascotte_2', 'Lyra', '../games/attrape/assets/images/mascotte/lyra.png'],
    ['attrape_orbe_1', 'Orbe nocturne', '../games/attrape/assets/orbes/orb_black.png']
  ].map(([id, label, src]) => Object.freeze({ id, label, src, type: 'avatar', ownership: 'image' }));
  const badges = { explorer: ['🌙', 'Explorateur Nocturne'], fidele: ['⭐', 'Joueur Fidèle'], centre: ['🔮', 'Compagnon du Centre'], paques: ['🥚', 'Chasseur de Pâques'] };
  window.CJProfileCatalog = Object.freeze({
    get entries() { return entries.slice(); },
    badge(id) { const info = badges[id.replace(/^badge_/, '')]; return info ? `${info[0]} ${info[1]}` : id; },
    register(item) {
      if (!item || !['avatar', 'background'].includes(item.type) || typeof item.id !== 'string' || !item.id || typeof item.label !== 'string' || typeof item.src !== 'string') throw new Error('Cosmétique invalide');
      const url = new URL(item.src, location.href);
      if (url.origin !== location.origin || !['http:', 'https:', 'file:'].includes(url.protocol) || entries.some(entry => entry.id === item.id)) throw new Error('Source ou identifiant invalide');
      entries.push(Object.freeze({ ...item, ownership: 'cosmetic' }));
      window.dispatchEvent(new Event('cj-profile-catalog'));
    }
  });
})();
