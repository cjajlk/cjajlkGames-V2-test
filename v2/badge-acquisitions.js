/* Uses only existing badge receipts and the existing coordinated account writer. No CJ operations. */
(() => {
  'use strict';
  const enabled = new Set([...Array.from({ length: 10 }, (_, i) => i + 1), 16, 17, 18, 19].map(n => `nocturne_badge_${String(n).padStart(2, '0')}`));
  let pending = null, lastError = '';
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  function refreshCard() {
    const profile = window.CJDashboardProfile.read();
    const item = (window.CJNocturnalBadges || []).find(item => item.id === profile.selected);
    for (const el of document.querySelectorAll('[data-profile="selected"]')) {
      el.querySelector('.equipped-badge-art')?.remove();
      if (item && profile.badges?.includes(item.id)) { const img = document.createElement('img'); img.src = item.src; img.alt = ''; img.className = 'equipped-badge-art'; el.prepend(img); }
    }
  }
  function check() {
    if (pending) return pending;
    if (!window.CJajlkAccount?.isIdentityReady?.()) return Promise.resolve({ ok: false, code: 'account' });
    // Re-read eligibility and possessions INSIDE the existing account lock.
    pending = window.CJV2AccountTransactions.update(player => {
      if (!object(player.items) || !object(player.items.unlockedBadges)) return { ok: false, code: 'invalid' };
      const missing = window.CJBadgeProgress.read(player).filter(badge => enabled.has(badge.id) && badge.eligible === true && !Object.hasOwn(player.items.unlockedBadges, badge.id));
      if (!missing.length) return { ok: true, changed: false };
      const badges = { ...player.items.unlockedBadges };
      const now = Date.now();
      // Same native receipt shape as unlockBadge: no new player field or storage key.
      for (const badge of missing) badges[badge.id] = { unlockedAt: now, price: null };
      player.items = { ...player.items, unlockedBadges: badges };
      return { ok: true, changed: true };
    }).then(result => {
      lastError = result.ok ? '' : 'Attribution suspendue : sauvegarde non confirmée ou verrou indisponible. Réessaie en rouvrant le profil.';
      window.dispatchEvent(new Event('cj-badge-acquisition-result'));
      return result;
    }).finally(() => { pending = null; });
    return pending;
  }
  window.CJBadgeAcquisitions = Object.freeze({ check, enabled: id => enabled.has(id), get error() { return lastError; } });
  for (const event of ['cj-account-ready', 'cj-account-updated', 'cj-badge-progress', 'focus', 'pageshow']) window.addEventListener(event, check);
  window.addEventListener('storage', event => { if (event.key === 'cjPlayerData') check(); });
  window.addEventListener('cj-profile-render', refreshCard);
  window.addEventListener('hashchange', check);
  refreshCard(); check();
})();
