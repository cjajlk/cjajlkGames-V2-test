/* V2-only coordination. The existing account remains the only wallet/storage. */
(() => {
  'use strict';
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const failure = code => ({ ok: false, code });
  window.CJV2AccountTransactions = Object.freeze({
    get supported() { return typeof navigator.locks?.request === 'function'; },
    async update(change, { requireLock = true } = {}) {
      const execute = () => {
        const api = window.CJajlkAccount;
        if (!api || typeof api.getPlayer !== 'function' || typeof api.savePlayer !== 'function') return failure('account');
        const player = api.getPlayer();
        if (!record(player)) return failure('account');
        const original = JSON.stringify(player);
        const result = change(player, api);
        if (!result?.ok || !result.changed) return result;
        // Also detect a legacy writer that changed the account during preparation.
        if (JSON.stringify(api.getPlayer()) !== original) return failure('conflict');
        api.savePlayer(player); // Exactly one atomic localStorage value write.
        if (JSON.stringify(api.getPlayer()) !== JSON.stringify(player)) return failure('storage');
        window.dispatchEvent(new Event('cj-account-updated'));
        return result;
      };
      try {
        if (!this.supported) return requireLock ? failure('unsupported') : execute();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          return await navigator.locks.request('cjajlk-v2-account-write', { signal: controller.signal }, execute);
        } finally { clearTimeout(timeout); }
      } catch (error) { return failure(error?.name === 'AbortError' ? 'busy' : 'storage'); }
    }
  });
})();
