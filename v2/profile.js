/* No initialization or migration. Only explicit equipment actions write. */
(() => {
  'use strict';
  const number = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
  const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const owns = (map, id) => Object.hasOwn(record(map), id) && !!map[id];
  const available = player => window.CJProfileCatalog.entries.filter(item => owns(item.ownership === 'image' ? player.unlockedImages : player.items?.unlockedCosmetics, item.id));
  window.CJDashboardProfile = Object.freeze({
    read() {
      try {
        const api = window.CJajlkAccount;
        if (!api || typeof api.getPlayer !== 'function') return { state: 'unavailable' };
        const player = api.getPlayer();
        if (!player || typeof player !== 'object' || Array.isArray(player)) return { state: 'missing' };
        const stats = record(player.stats), byGame = record(stats.byGame), times = record(stats.playTime?.byGame);
        const games = [...new Set([...Object.keys(byGame), ...Object.keys(times)])].map(id => ({ id, cj: number(byGame[id]), seconds: number(times[id]) }));
        const badges = Object.keys(record(player.items?.unlockedBadges)).filter(id => owns(player.items.unlockedBadges, id));
        const cosmetics = available(player);
        return {
          state: 'ready', pseudo: typeof player.pseudo === 'string' && player.pseudo.trim() ? player.pseudo : 'Profil joueur',
          balance: number(stats.totalCJ), seconds: number(stats.playTime?.totalSeconds),
          badges: player.items?.unlockedBadges ? badges : null,
          selected: badges.includes(player.selectedBadge) ? player.selectedBadge : null,
          avatar: cosmetics.find(item => item.type === 'avatar' && item.id === player.profileV2?.avatar) || null,
          background: cosmetics.find(item => item.type === 'background' && item.id === player.profileV2?.background) || null,
          cosmetics, games: games.filter(game => game.cj > 0 || game.seconds > 0),
          played: stats.byGame || stats.playTime?.byGame ? games.filter(game => game.cj > 0 || game.seconds > 0).length : null
        };
      } catch { return { state: 'unavailable' }; }
    },
    async equip(type, id) {
      try {
        if (!['avatar', 'background', 'badge'].includes(type) || (id !== null && typeof id !== 'string')) return false;
        const result = await window.CJV2AccountTransactions.update(player => {
          if (id !== null && (type === 'badge' ? !owns(player.items?.unlockedBadges, id) : !available(player).some(item => item.type === type && item.id === id))) return { ok: false };
          if (type === 'badge') player.selectedBadge = id;
          else player.profileV2 = { ...record(player.profileV2), [type]: id };
          return { ok: true, changed: true };
        }, { requireLock: false });
        return result.ok;
      } catch { return false; }
    }
  });
})();
