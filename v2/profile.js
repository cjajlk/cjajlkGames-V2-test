/* No initialization or migration. Only explicit equipment actions write. */
(() => {
  'use strict';
  const number = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
  const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const owns = (map, id) => Object.hasOwn(record(map), id) && !!map[id];
  const available = player => window.CJProfileCatalog.entries.filter(item => owns(item.ownership === 'image' ? player.unlockedImages : player.items?.unlockedCosmetics, item.id));
  function activity(stats = {}) {
    const byGame = record(stats.byGame), times = record(stats.playTime?.byGame), catalog = window.CJGameCatalog;
    const games = [...new Set([...(catalog?.entries || []).map(game => game.id), ...Object.keys(byGame), ...Object.keys(times)])].map(id => {
      const local = catalog?.localActivity(id) || { recorded: false, detail: null };
      const cj = number(byGame[id]), seconds = number(times[id]);
      return { id, name: catalog?.entries.find(game => game.id === id)?.name || id, cj, seconds, detail: local.detail,
        recorded: cj > 0 || seconds > 0 || local.recorded, known: !!catalog?.entries.some(game => game.id === id) };
    });
    return { games: games.filter(game => game.known || game.recorded),
      played: stats.byGame || stats.playTime?.byGame || games.some(game => game.recorded) ? games.filter(game => game.recorded).length : null };
  }
  window.CJDashboardProfile = Object.freeze({
    read() {
      try {
        const api = window.CJajlkAccount;
        if (!api || typeof api.getPlayer !== 'function') return { state: 'unavailable', ...activity() };
        const player = api.getPlayer();
        if (!player || typeof player !== 'object' || Array.isArray(player)) return { state: 'missing', ...activity() };
        const stats = record(player.stats);
        const badges = Object.keys(record(player.items?.unlockedBadges)).filter(id => owns(player.items.unlockedBadges, id));
        const cosmetics = available(player);
        return {
          state: 'ready', pseudo: typeof player.pseudo === 'string' && player.pseudo.trim() ? player.pseudo : 'Profil joueur',
          balance: number(stats.totalCJ), seconds: number(stats.playTime?.totalSeconds),
          badges: player.items?.unlockedBadges ? badges : null,
          selected: badges.includes(player.selectedBadge) ? player.selectedBadge : null,
          avatar: cosmetics.find(item => item.type === 'avatar' && item.id === player.profileV2?.avatar) || null,
          background: cosmetics.find(item => item.type === 'background' && item.id === player.profileV2?.background) || null,
          cosmetics, ...activity(stats)
        };
      } catch { return { state: 'unavailable', ...activity() }; }
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
