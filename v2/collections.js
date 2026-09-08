(() => {
  'use strict';
  const config = window.CJCollectionsConfig;
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const objectOrEmpty = value => { if (value === undefined) return {}; if (!record(value)) throw new Error('Invalid collection record'); return value; };
  const stateFor = (player, id) => {
    const store = objectOrEmpty(player.collectionsV1);
    if (store.version !== undefined && store.version !== 1) throw new Error('Unsupported collections version');
    const entries = objectOrEmpty(store.entries), entry = objectOrEmpty(entries[id]), pieces = objectOrEmpty(entry.pieces);
    // Known slots are permanent: any truthy acquisition record is owned.
    const acquired = Array.from({ length: config.pieces }, (_, i) => Object.hasOwn(pieces, i) && !!pieces[i]);
    return { store, entries, entry, pieces, acquired, count: acquired.filter(Boolean).length, next: acquired.indexOf(false) };
  };
  window.CJCollections = Object.freeze({
    read() {
      try {
        const player = window.CJajlkAccount?.getPlayer();
        if (!record(player)) return { state: 'account', cards: config.collections.map(item => ({ ...item, count: 0, next: 0, acquired: [false, false, false, false] })) };
        const cards = config.collections.map(item => ({ ...item, ...stateFor(player, item.id) }));
        const balance = player.stats?.totalCJ;
        return { state: typeof balance === 'number' && Number.isFinite(balance) && balance >= 0 ? 'ready' : 'account', balance, cards };
      } catch { return { state: 'invalid', cards: [] }; }
    },
    async buy(id, piece) {
      const item = config.collections.find(entry => entry.id === id);
      if (!item || !Number.isInteger(piece) || piece < 0 || piece >= config.pieces) return { ok: false, code: 'invalid' };
      return window.CJV2AccountTransactions.update((player, api) => {
        let data;
        try { data = stateFor(player, id); } catch { return { ok: false, code: 'invalid' }; }
        if (data.acquired[piece]) return { ok: true, changed: false, code: 'owned' };
        if (piece !== data.next) return { ok: false, code: 'stale' };
        const price = config.piecePriceCJ, balance = player.stats?.totalCJ;
        if (!Number.isSafeInteger(price) || price <= 0 || typeof balance !== 'number' || !Number.isFinite(balance) || balance < 0 || typeof api.spendCJ !== 'function') return { ok: false, code: 'account' };
        if (balance < price) return { ok: false, code: 'funds' };
        let items, cosmetics;
        try { items = objectOrEmpty(player.items); cosmetics = objectOrEmpty(items.unlockedCosmetics); } catch { return { ok: false, code: 'invalid' }; }
        // Invoke the EXISTING debit rule on this transaction's fresh account snapshot.
        // Its save is staged, not persisted: debit + piece + reward commit together below.
        // Neither the global API nor the engine is patched or replaced.
        let staged = false;
        const context = { ensureDataStructure: () => player, savePlayer: value => { staged = value === player; } };
        if (!api.spendCJ.call(context, price) || !staged || player.stats.totalCJ !== balance - price) return { ok: false, code: 'account' };
        const now = Date.now();
        const pieces = { ...data.pieces, [piece]: { acquiredAt: now, priceCJ: price } };
        const completed = data.count + 1 === config.pieces;
        const entry = { ...data.entry, pieces };
        if (completed) {
          entry.completedAt = data.entry.completedAt || now;
          player.items = { ...items, unlockedCosmetics: { ...cosmetics, [item.backgroundId]: cosmetics[item.backgroundId] || { unlockedAt: now, source: 'collection', collectionId: id } } };
        }
        player.collectionsV1 = { ...data.store, version: 1, entries: { ...data.entries, [id]: entry } };
        return { ok: true, changed: true, code: completed ? 'complete' : 'purchased', piece, price };
      });
    }
  });

  const container = document.getElementById('collections-grid');
  const notice = document.getElementById('collections-notice');
  const status = document.getElementById('collections-status');
  let busy = false;
  const messages = {
    account: 'Ton compte CJ doit être disponible pour acheter un morceau. Lance un jeu avec ton compte habituel, puis reviens ici.',
    invalid: 'Les données Collections ne sont pas lisibles. Aucun achat n’a été effectué ; tes données sont conservées.',
    unsupported: 'Les achats sont indisponibles dans ce navigateur ou cette connexion. Ouvre la V2 sur localhost ou en HTTPS dans un navigateur récent.',
    funds: 'CJ insuffisants. Gagne des CJ Universels en jouant, puis reviens débloquer ce morceau.',
    storage: 'L’achat n’a pas pu être confirmé. Recharge la page pour vérifier ta progression avant de réessayer.',
    conflict: 'Ton compte a été actualisé ailleurs. Vérifie le solde et réessaie.',
    stale: 'La progression a changé. Le prochain morceau a été actualisé ; aucun débit supplémentaire.',
    owned: 'Ce morceau est déjà acquis. Aucun CJ supplémentaire débité.',
    busy: 'Une autre opération est en cours. Réessaie dans quelques instants.'
  };
  const element = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  function focusCollection(id) {
    const card = container.querySelector(`[data-collection="${id}"]`);
    (card?.querySelector('button:not(:disabled), a') || card)?.focus({ preventScroll: true });
  }
  function render() {
    const state = window.CJCollections.read();
    const focusedId = document.activeElement?.closest('[data-collection]')?.dataset.collection;
    notice.textContent = state.state !== 'ready' ? messages[state.state] : !window.CJV2AccountTransactions.supported ? messages.unsupported : '';
    notice.hidden = !notice.textContent;
    container.replaceChildren();
    for (const item of state.cards) {
      const card = element('article', 'panel collection-card'); card.dataset.collection = item.id; card.tabIndex = -1;
      const heading = element('div', 'collection-heading');
      const title = element('h2', '', item.title); title.id = `collection-${item.id}`;
      card.setAttribute('aria-labelledby', title.id);
      heading.append(title, element('span', 'pill collection-count', `${item.count}/4`));
      card.append(heading, element('p', 'subtle collection-subtitle', item.subtitle));
      const preview = element('div', 'collection-preview'); preview.setAttribute('role', 'img');
      preview.setAttribute('aria-label', `${item.title} : ${item.count} morceaux révélés sur 4`);
      if (item.count === 4) {
        const img = element('img', 'collection-complete-image'); img.src = item.src; img.alt = ''; preview.append(img);
      } else {
        for (let index = 0; index < config.pieces; index++) {
          const tile = element('div', item.acquired[index] ? 'collection-piece revealed' : 'collection-piece masked');
          tile.setAttribute('aria-hidden', 'true'); tile.dataset.piece = index;
          if (item.acquired[index]) {
            const img = element('img'); img.src = item.src; img.alt = ''; img.style.left = `${-(index % 2) * 100}%`; img.style.top = `${-Math.floor(index / 2) * 100}%`; tile.append(img);
          } else { tile.append(element('span', 'piece-symbol', item.icon), element('span', 'piece-number', `Morceau ${index + 1}`)); }
          preview.append(tile);
        }
      }
      card.append(preview);
      const progress = element('progress'); progress.max = config.pieces; progress.value = item.count; progress.setAttribute('aria-label', `Progression de ${item.title}`); card.append(progress);
      if (item.count === 4) {
        card.append(element('p', 'collection-reward', '✧ Collection complète · Fond de profil acquis'));
        const link = element('a', 'button collection-equip-link', 'Choisir ce fond dans mon profil'); link.href = '#profil'; card.append(link);
      } else {
        card.append(element('p', 'collection-price', `${config.piecePriceCJ} CJ / morceau · Prix de test`));
        const button = element('button', 'button buy-piece', busy ? 'Un instant…' : `Débloquer le morceau ${item.next + 1} · ${config.piecePriceCJ} CJ`);
        button.type = 'button'; button.dataset.buy = item.id;
        button.disabled = busy || state.state !== 'ready' || !window.CJV2AccountTransactions.supported || state.balance < config.piecePriceCJ;
        button.addEventListener('click', async event => {
          if (busy || event.detail > 1) return;
          busy = true; status.textContent = 'Achat en cours…'; render();
          const result = await window.CJCollections.buy(item.id, item.next);
          status.textContent = result.code === 'complete' ? `✧ ${item.title} complétée ! Ton nouveau fond est définitivement acquis. Retrouve-le dans Personnaliser.` : result.code === 'purchased' ? `${item.title} : morceau ${item.next + 1} acquis pour ${result.price} CJ.` : (messages[result.code] || messages.storage);
          status.classList.toggle('reward-message', result.code === 'complete');
          // A rapid second click must never target the newly rendered next piece.
          setTimeout(() => { busy = false; render(); }, 600);
          render();
        });
        card.append(button);
        if (state.state === 'ready' && state.balance < config.piecePriceCJ) card.append(element('p', 'subtle insufficient-cj', `Il te manque ${config.piecePriceCJ - state.balance} CJ pour ce morceau.`));
      }
      container.append(card);
    }
    if (focusedId) focusCollection(focusedId);
  }
  window.addEventListener('storage', event => { if (!event.key || event.key === 'cjPlayerData') render(); });
  for (const event of ['cj-account-updated', 'pageshow', 'focus', 'hashchange']) window.addEventListener(event, render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  render();
})();
