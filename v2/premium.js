/* Presentation only. Reads existing catalogs; equipment uses the unchanged profile API. */
(() => {
  'use strict';
  const node = (tag, className, text) => { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; };
  const number = n => n == null ? '—' : new Intl.NumberFormat('fr-FR').format(n);
  const time = n => n == null ? 'Non enregistré' : n < 60 ? `${Math.floor(n)} s` : `${Math.floor(n / 3600)} h ${Math.floor(n % 3600 / 60)} min`;
  const genres = [
    ['arcade', 'Arcade & Réflexes', 'Le plaisir de recommencer.', ['breaker', 'shift']],
    ['action', 'Action & Vitesse', 'Entre envols et courses nocturnes.', ['velocity', 'jetclash', 'runner', 'nyr']],
    ['adventure', 'Aventure & Exploration', 'Un monde à découvrir, à ton rythme.', ['attrape', 'lumi']],
    ['relax', 'Détente & Gestion', 'Prends le temps de faire grandir ton univers.', ['farm']]
  ];
  const match = card => { const href = card.getAttribute('href'); return href.includes('/attrape/') ? 'attrape' : href.includes('/breaker/') ? 'breaker' : href.includes('nocturne-farm') ? 'farm' : href.includes('nocturne-velocity') ? 'velocity' : href.includes('Nocturne-Shift') ? 'shift' : href.includes('/NYR/') ? 'nyr' : href.includes('jet-clash') ? 'jetclash' : href.includes('nocturne-runner') ? 'runner' : href.includes('neon-nomad') ? 'lumi' : null; };
  const cards = [...document.querySelectorAll('[data-page="jeux"] a.game-card')];
  const host = document.getElementById('game-sections'), filters = document.getElementById('game-filters');
  const all = node('button', '', 'Tous les jeux'); all.type = 'button'; all.dataset.genre = 'all'; all.setAttribute('aria-pressed', 'true'); filters.append(all);
  host.replaceChildren();
  for (const [id, label, description, ids] of genres) {
    const selected = cards.filter(card => ids.includes(match(card))); if (!selected.length) continue;
    const section = node('section', 'genre-section'); section.dataset.genreSection = id;
    const heading = node('div', 'section-heading'), text = node('div'); text.append(node('h2', '', label), node('p', 'subtle', description)); heading.append(text, node('span', 'genre-count', `${selected.length} jeu${selected.length > 1 ? 'x' : ''}`)); section.append(heading);
    const grid = node('div', 'game-grid');
    for (const card of selected) {
      card.dataset.gameId = match(card); const content = card.querySelector('div');
      const category = node('small', 'game-genre', label); content.prepend(category);
      const title = card.querySelector('h2'); title.textContent = title.textContent.replace(/\s*↗\s*$/, '');
      card.querySelector('.text-link').textContent = 'Jouer ↗';
      if (match(card) === 'nyr') card.querySelector('p').textContent = 'Guide ton dragon dans le vide astral.';
      if (match(card) === 'shift') card.querySelector('p').textContent = 'Fragments, combos et Éclipse.';
      if (match(card) === 'velocity') card.querySelector('p').textContent = 'Glisse. Explore. Repousse tes limites.';
      card.querySelector('img').loading = 'lazy'; grid.append(card);
    }
    section.append(grid); host.append(section);
    const button = node('button', '', label); button.type = 'button'; button.dataset.genre = id; button.setAttribute('aria-pressed', 'false'); filters.append(button);
  }
  filters.addEventListener('click', event => { const button = event.target.closest('[data-genre]'); if (!button) return; filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button))); host.querySelectorAll('[data-genre-section]').forEach(s => { s.hidden = button.dataset.genre !== 'all' && s.dataset.genreSection !== button.dataset.genre; }); });

  document.getElementById('edit-common-pseudo').addEventListener('click', () => {
    document.getElementById('universal-name-form').scrollIntoView({ block: 'center' });
    document.getElementById('universal-name').focus({ preventScroll: true });
  });
  let profilePanel = 'adventures', cosmeticFilter = 'avatar', preview = null, previewReturn = null;
  const openAdventures = new Set();
  const selectPanel = value => { profilePanel = value; document.querySelectorAll('[data-profile-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.profileTab === value))); document.querySelectorAll('[data-profile-panel]').forEach(p => { p.hidden = p.dataset.profilePanel !== value; }); };
  document.querySelector('.profile-tabs').addEventListener('click', event => { const b = event.target.closest('[data-profile-tab]'); if (b) selectPanel(b.dataset.profileTab); });
  document.querySelector('.cosmetic-tabs').addEventListener('click', event => { const b = event.target.closest('[data-cosmetic-filter]'); if (!b) return; cosmeticFilter = b.dataset.cosmeticFilter; document.querySelectorAll('[data-cosmetic-filter]').forEach(el => el.setAttribute('aria-pressed', String(el === b))); renderCosmetics(); });
  const categories = { explorer: 'Cosmétique', fidele: 'Cosmétique', centre: 'Social', paques: 'Événement' };
  function cosmetics() {
    const profile = CJDashboardProfile.read();
    const items = CJProfileCatalog.entries.map(item => ({ ...item, owned: (profile.cosmetics || []).some(c => c.id === item.id) }));
    for (const item of CJShopConfig.items.filter(item => item.type === 'badge')) items.push({ ...item, owned: (profile.badges || []).includes(item.id) });
    for (const id of profile.badges || []) if (!items.some(item => item.type === 'badge' && item.id === id) && !(window.CJNocturnalBadges || []).some(item => item.id === id)) items.push({ id, type: 'badge', label: CJProfileCatalog.badge(id), owned: true });
    const progress = window.CJBadgeProgress.read();
    items.push(...(window.CJNocturnalBadges || []).map(item => ({ ...item, owned: progress.find(p => p.id === item.id)?.obtained || false })));
    return items.map(item => ({ ...item, equipped: item.type === 'badge' ? profile.selected === item.id : profile[item.type]?.id === item.id }));
  }
  function condition(item) {
    if (item.family) return window.CJBadgeProgress.read().find(p => p.id === item.id)?.condition || 'Suivi indisponible';
    if (item.availability === "pending") return "À débloquer prochainement";
    const shop = CJShopConfig.items.find(s => s.id === item.id && s.type === item.type);
    if (shop) return `${shop.priceCJ} CJ en boutique${shop.available ? '' : ' · Événement actuellement fermé'}`;
    const collection = CJCollectionsConfig.collections.find(c => c.backgroundId === item.id);
    if (collection) { const state = CJCollections?.read().cards.find(c => c.id === collection.id); return `Collection ${collection.title} · ${state?.count ?? 0}/${CJCollectionsConfig.pieces} morceaux · ${CJCollectionsConfig.piecePriceCJ} CJ par morceau`; }
    return item.owned ? 'Élément historique déjà débloqué.' : 'Déblocage non proposé dans la boutique V2.';
  }
  function cosmeticTile(item) {
    const tile = node('article', `cosmetic-tile${item.owned ? ' is-owned' : ''}`);
    tile.dataset.cosmeticId = item.id; tile.dataset.cosmeticType = item.type;
    if (item.type === 'avatar' || item.type === 'badge') {
      tile.classList.add('avatar-tile'); if (item.family) tile.dataset.family = item.family;
      const name = node('h3', 'avatar-name', item.label); tile.append(name);
      const button = node('button', 'avatar-thumbnail'); button.type = 'button';
      button.setAttribute('aria-label', item.label + (item.equipped ? ' · Équipé' : item.owned ? ' · Possédé' : ' · Verrouillé') + ' · Voir les détails');
      if (item.src) { const img = node('img'); img.src = item.src; img.alt = ''; img.loading = 'lazy'; button.append(img); } else button.append(node('span', 'legacy-badge-icon', item.label.split(' ')[0]));
      if (!item.owned || item.equipped) { const state = node('span', 'avatar-indicator', item.equipped ? '✓' : '🔒'); state.setAttribute('aria-hidden', 'true'); button.append(state); }
      if (item.equipped) { tile.classList.add('is-equipped'); button.setAttribute('aria-current', 'true'); }
      button.addEventListener('click', () => { previewReturn = { container: item.type === 'badge' ? 'badge-catalog' : 'cosmetic-catalog', id: item.id, type: item.type }; showPreview(item); }); tile.append(button); return tile;
    }
    if (item.src) { const img = node('img'); img.src = item.src; img.alt = ''; img.loading = 'lazy'; tile.append(img); } else tile.append(node('div', 'badge-symbol', item.label.split(' ')[0]));
    tile.append(node('span', 'cosmetic-state', item.equipped ? 'Équipé' : item.owned ? 'Débloqué' : item.availability === 'pending' ? 'Bientôt disponible' : 'À découvrir'), node('h3', '', item.label), node('p', 'cosmetic-condition', condition(item)));
    const button = node('button', 'preview-button', 'Voir l’aperçu'); button.type = 'button'; button.addEventListener('click', () => { previewReturn = { container: button.closest('#badge-catalog') ? 'badge-catalog' : 'cosmetic-catalog', id: item.id, type: item.type }; showPreview(item); }); tile.append(button); return tile;
  }
  function renderCosmetics() { const container = document.getElementById('cosmetic-catalog'); container.classList.toggle('avatar-grid', cosmeticFilter === 'avatar'); const focused = document.activeElement?.closest('.cosmetic-tile')?.querySelector('h3')?.textContent; container.replaceChildren(...cosmetics().filter(item => item.type === cosmeticFilter).map(cosmeticTile)); if (focused) [...container.children].find(c => c.querySelector('h3').textContent === focused)?.querySelector('button').focus(); }
  function renderBadges() {
    const container = document.getElementById('badge-catalog'); container.classList.add('badge-grid'); container.replaceChildren();
    const retiredCards = new Set(['explorer', 'fidele', 'centre', 'paques']);
    for (const item of cosmetics().filter(item => item.type === 'badge' && !retiredCards.has(item.id))) { const card = cosmeticTile(item); container.append(card); }
  }

  function renderStats(profile) {
    const container = document.getElementById('profile-statistics-content'); container.replaceChildren();
    const total = node('div', 'total-playtime'); total.append(node('span', 'eyebrow', 'TEMPS ACTIF TOTAL'), node('strong', '', time(profile.seconds)), node('span', 'subtle', 'Une lecture du total sauvegardé, sans addition des records.')); container.append(total);
    const list = node('dl', 'statistics-list');
    for (const game of profile.games || []) { const row = node('div'); row.append(node('dt', '', game.name), node('dd', '', time(game.seconds))); list.append(row); } container.append(list);
  }
  function decorateAdventures(profile) {
    for (const card of document.querySelectorAll('#game-stats article')) {
      const game = profile.games?.find(g => g.id === card.dataset.game); if (!game || card.querySelector('details')) continue;
      const title = card.querySelector('h3'), paragraphs = [...card.querySelectorAll('p')]; card.classList.add('adventure-card');
      const details = node('details'), summary = node('summary'); summary.append(title, node('span', 'adventure-time', game.recorded ? time(game.seconds) : 'À découvrir'));
      details.open = openAdventures.has(game.id);
      details.addEventListener('toggle', () => { if (!details.isConnected) return; if (details.open) openAdventures.add(game.id); else openAdventures.delete(game.id); });
      const body = node('div', 'adventure-body'); body.append(...paragraphs); details.append(summary, body); card.replaceChildren(details);
    }
  }
  const previewDialog = document.getElementById('cosmetic-preview');
  function showPreview(item) {
    preview = item; previewDialog.classList.toggle('avatar-detail', item.type === 'avatar' || !!item.family); previewDialog.querySelector('.detail-portrait')?.remove(); if (item.type === 'avatar' || item.family) { const portrait = node('img', 'detail-portrait'); portrait.src = item.src; portrait.alt = item.label; document.getElementById('preview-card').before(portrait); } const profile = CJDashboardProfile.read(), card = document.getElementById('preview-card'); card.replaceChildren();
    previewDialog.classList.toggle('badge-detail', !!item.family);
    const background = item.type === 'background' ? item : profile.background, avatar = item.type === 'avatar' ? item : profile.avatar;
    card.style.backgroundImage = background ? `linear-gradient(0deg,#090d1ede,transparent),url(${JSON.stringify(background.src)})` : '';
    const image = node('div', 'preview-avatar'); if (avatar) { const img = node('img'); img.src = avatar.src; img.alt = ''; image.append(img); } else image.textContent = '☾';
    card.append(image, node('span', 'eyebrow', 'APERÇU · NON ENREGISTRÉ'), node('h3', '', profile.pseudo || 'Profil joueur'), node('p', '', item.type === 'badge' ? item.label : profile.selected ? CJProfileCatalog.badge(profile.selected) : 'Aucun titre équipé'));
    document.getElementById('preview-heading').textContent = item.label;
    const badgeProgress = item.family ? window.CJBadgeProgress.read().find(p => p.id === item.id) : null;
    document.getElementById('preview-description').textContent = (item.family ? item.category + ' · ' + badgeProgress.status : item.owned ? 'Possédé' : 'Non possédé') + ' · ' + condition(item);
    previewDialog.querySelector('.badge-evidence')?.remove();
    if (badgeProgress) {
      const evidence = node('section', 'badge-evidence'); evidence.setAttribute('aria-label', 'Progression enregistrée');
      for (const part of badgeProgress.parts) {
        const row = node('p');
        const value = part.value === null ? 'Suivi indisponible' : part.label.includes('(secondes)') ? `${time(part.value)} / ${time(part.target)}` : `${part.value} / ${part.target}`;
        row.append(node('strong', '', part.label.replace(' (secondes)', '')), node('span', '', value));
        if (part.reason) row.append(node('small', '', part.reason)); evidence.append(row);
      }
      if (badgeProgress.percent === 100) evidence.append(node('p', 'badge-complete', badgeProgress.obtained ? '100 % · Badge obtenu.' : '100 % · Conditions vérifiées ; sauvegarde à confirmer.'));
      evidence.append(node('p', 'subtle', badgeProgress.note));
      document.getElementById('preview-description').after(evidence);
    }
    const equip = document.getElementById('preview-equip'); equip.hidden = !item.owned; equip.disabled = !item.owned || profile.state !== 'ready'; equip.textContent = item.family && profile.selected === item.id ? 'Retirer ce badge' : item.owned ? 'Équiper cet élément' : 'Élément non débloqué';
    document.getElementById('preview-status').textContent = '';
    if (!previewDialog.open) previewDialog.showModal();
  }
  for (const id of ['preview-close', 'preview-cancel']) document.getElementById(id).addEventListener('click', () => previewDialog.close());
  previewDialog.addEventListener('close', () => { const target = [...document.getElementById(previewReturn?.container || 'cosmetic-catalog').children].find(card => card.dataset.cosmeticId === previewReturn?.id && card.dataset.cosmeticType === previewReturn?.type); (target?.querySelector('button') || document.getElementById('personalize')).focus({ preventScroll: true }); });
  document.getElementById('preview-equip').addEventListener('click', async () => {
    if (!preview) return; const button = document.getElementById('preview-equip'); button.disabled = true;
    const id = preview.family && CJDashboardProfile.read().selected === preview.id ? null : preview.id;
    const ok = await CJDashboardProfile.equip(preview.type, id);
    document.getElementById('preview-status').textContent = ok ? 'Équipement enregistré.' : 'Impossible d’enregistrer cet équipement. Tes données sont conservées.';
    window.dispatchEvent(new Event('cj-account-updated')); button.disabled = !ok;
  });
  function render() { const profile = CJDashboardProfile.read(); decorateAdventures(profile); renderBadges(); renderCosmetics(); renderStats(profile); selectPanel(profilePanel);
    let featured = document.getElementById('featured-badges'); if (!featured) { featured = node('div', 'featured-badges'); featured.id = 'featured-badges'; featured.setAttribute('aria-label', 'Badges acquis'); document.querySelector('.profile-detail').append(featured); }
    featured.replaceChildren(...(profile.badges || []).slice(0, 3).map(id => node('span', 'pill', CJProfileCatalog.badge(id))));
    if (previewDialog.open && preview?.family) showPreview(cosmetics().find(item => item.id === preview.id) || preview);
  }
  window.addEventListener('cj-profile-render', render); render();
  window.addEventListener('cj-badge-progress', render);
  window.addEventListener('cj-badge-acquisition-result', render);
})();
