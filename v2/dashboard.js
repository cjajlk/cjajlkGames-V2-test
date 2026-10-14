(() => {
  'use strict';
  const labels = { accueil: 'Accueil', profil: 'Profil', jeux: 'Jeux', boutique: 'Boutique', collections: 'Collections', apropos: 'À propos' };
  const formatNumber = value => value == null ? '—' : new Intl.NumberFormat('fr-FR').format(value);
  const formatTime = seconds => seconds == null ? '—' : `${Math.floor(seconds / 3600)} h ${Math.floor(seconds % 3600 / 60)} min`;
  function renderProfile() {
    const profile = window.CJDashboardProfile.read();
    const values = {
      pseudo: profile.pseudo || 'Profil joueur', balance: formatNumber(profile.balance), time: formatTime(profile.seconds),
      badges: formatNumber(profile.badges?.length), played: formatNumber(profile.played), selected: profile.selected ? window.CJProfileCatalog.badge(profile.selected) : 'Aucun titre équipé',
      status: profile.state === 'ready' ? 'Compte de ce navigateur' : profile.state === 'missing' ? 'Aucun profil lisible dans ce navigateur.' : 'Compte indisponible pour le moment.'
    };
    document.querySelectorAll('[data-profile]').forEach(el => { el.textContent = values[el.dataset.profile]; });
    const nameInput = document.getElementById('universal-name');
    if (nameInput && document.activeElement !== nameInput) nameInput.value = profile.pseudo || '';
    document.getElementById('personalize').disabled = profile.state !== 'ready';
    document.querySelectorAll('.avatar').forEach(el => {
      el.replaceChildren();
      if (profile.avatar) { const img = document.createElement('img'); img.src = profile.avatar.src; img.alt = ''; el.append(img); } else el.textContent = '☾';
    });
    document.querySelectorAll('.profile-detail, .player-card').forEach(el => {
      const overlay = (el.classList.contains('profile-detail') || el.classList.contains('home-card-front')) ? 'linear-gradient(90deg,rgba(10,14,26,.66),rgba(10,14,26,.18)),linear-gradient(0deg,rgba(10,14,26,.88),transparent 65%)' : 'linear-gradient(90deg,rgba(16,18,34,.92),rgba(16,18,34,.82))';
      el.style.backgroundImage = profile.background ? `${overlay},url(${JSON.stringify(profile.background.src)})` : '';
    });
    const stats = document.getElementById('game-stats');
    stats.replaceChildren();
    for (const game of profile.games || []) {
      const card = document.createElement('article'); card.className = 'panel';
      card.dataset.game = game.id; card.dataset.activity = game.recorded ? 'recorded' : 'empty';
      const title = document.createElement('h3'); title.textContent = game.name || game.id;
      const text = document.createElement('p');
      text.textContent = game.recorded ? (game.cj !== null || game.seconds !== null ? `${formatNumber(game.cj)} CJ gagnés · ${formatTime(game.seconds)} de jeu` : game.detail) : 'Aucune activité enregistrée pour le moment.';
      card.append(title, text);
      if (game.detail && text.textContent !== game.detail) { const detail = document.createElement('p'); detail.className = 'subtle'; detail.textContent = game.detail; card.append(detail); }
      stats.append(card);
    }
    if (!profile.games) stats.textContent = 'Les statistiques apparaîtront lorsqu’un profil sera disponible.';
    else if (!profile.games.length) stats.textContent = 'Aucune activité de jeu enregistrée pour le moment.';
    const list = document.getElementById('badge-list'); list.replaceChildren();
    if (!profile.badges?.length) list.textContent = profile.badges ? 'Aucun badge débloqué pour le moment.' : 'Badges non disponibles.';
    for (const id of profile.badges || []) {
      const badge = document.createElement('span'); badge.className = 'pill'; badge.textContent = window.CJProfileCatalog.badge(id) + (id === profile.selected ? ' · Équipé' : ''); list.append(badge);
    }
    if (document.getElementById('customizer').open) renderChoices();
    window.dispatchEvent(new Event('cj-profile-render'));
  }
  const dialog = document.getElementById('customizer');
  function renderChoices() {
    const scrollTop = dialog.scrollTop;
    const profile = window.CJDashboardProfile.read();
    const container = document.getElementById('owned-choices');
    const focused = document.activeElement?.dataset.choice;
    container.replaceChildren();
    for (const [type, label, defaultLabel] of [['avatar', 'Avatars', 'Lune nocturne'], ['badge', 'Badges / titres', 'Aucun titre'], ['background', 'Fonds de carte', 'Fond nocturne']]) {
      const group = document.createElement('fieldset'), legend = document.createElement('legend'); legend.textContent = label; group.append(legend);
      const grid = document.createElement('div'); grid.className = 'choice-grid';
      const items = type === 'badge' ? (profile.badges || []).map(id => ({ id, label: window.CJProfileCatalog.badge(id) })) : (profile.cosmetics || []).filter(item => item.type === type);
      const selected = type === 'badge' ? profile.selected : profile[type]?.id;
      for (const item of [{ id: null, label: defaultLabel }, ...items]) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'cosmetic-choice'; button.dataset.choice = `${type}:${item.id || ''}`;
        button.setAttribute('aria-pressed', String((selected || null) === item.id)); button.disabled = profile.state !== 'ready';
        if (item.src) { const img = document.createElement('img'); img.src = item.src; img.alt = ''; button.append(img); }
        const name = document.createElement('span'); name.textContent = item.label; button.append(name);
        button.addEventListener('click', async () => {
          button.disabled = true;
          document.getElementById('equipment-status').textContent = 'Enregistrement du choix…';
          const success = await window.CJDashboardProfile.equip(type, item.id);
          document.getElementById('equipment-status').textContent = success ? `${item.label} : choix enregistré.` : 'Impossible d’enregistrer ce choix. Vérifie que le compte et cet élément sont toujours disponibles, puis réessaie.';
          renderProfile();
        });
        grid.append(button);
      }
      group.append(grid);
      if (!items.length) { const hint = document.createElement('p'); hint.className = 'subtle'; hint.textContent = type === 'background' ? 'Tes futurs fonds de Collections apparaîtront ici une fois débloqués.' : 'Aucun autre élément possédé pour le moment.'; group.append(hint); }
      container.append(group);
    }
    if (focused) [...container.querySelectorAll('button')].find(button => button.dataset.choice === focused)?.focus();
    dialog.scrollTop = scrollTop;
  }
  document.getElementById('personalize').addEventListener('click', () => { document.getElementById('equipment-status').textContent = ''; renderChoices(); dialog.showModal(); });
  dialog.querySelector('.close-picker').addEventListener('click', () => dialog.close());
  const nameForm = document.getElementById('universal-name-form');
  nameForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = nameForm.querySelector('button'), status = document.getElementById('universal-name-status');
    if (button.disabled) return;
    button.disabled = true;
    try {
      const result = await window.CJajlkAccount?.updatePseudo?.(document.getElementById('universal-name').value);
      const messages = { invalid: 'Choisis un pseudo de 2 à 24 caractères, sans caractères de contrôle ni chevrons.', busy: 'Le compte est utilisé dans un autre onglet. Reviens ici et réessaie.', unsupported: 'L’enregistrement nécessite HTTPS et un navigateur récent.' };
      status.textContent = result?.ok ? 'Pseudo enregistré pour tous les jeux de ce navigateur.' : messages[result?.code] || 'Le pseudo n’a pas pu être enregistré. Tes données sont conservées.';
      if (result?.ok) renderProfile();
    } finally { button.disabled = false; }
  });
  window.addEventListener('cj-account-ready', renderProfile);
  window.addEventListener('cj-profile-catalog', renderProfile);
  window.addEventListener('cj-account-updated', renderProfile);
  function navigate(focus) {
    const requested = location.hash.slice(1);
    const route = Object.hasOwn(labels, requested) ? requested : 'accueil';
    document.querySelectorAll('[data-page]').forEach(section => { section.hidden = section.dataset.page !== route; });
    document.querySelectorAll('nav a[href^="#"]').forEach(link => {
      if (link.hash === `#${route}`) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    document.getElementById('breadcrumb').textContent = labels[route];
    document.title = `${labels[route]} · CJAJLK Games`;
    if (focus) { document.getElementById('main').focus({ preventScroll: true }); window.scrollTo(0, 0); }
    renderProfile();
  }
  window.addEventListener('hashchange', () => navigate(true));
  window.addEventListener('storage', event => { if (event.key === 'cjPlayerData' || window.CJGameCatalog?.storageKeys.includes(event.key) || event.key === null) renderProfile(); });
  window.addEventListener('pageshow', renderProfile);
  window.addEventListener('focus', renderProfile);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderProfile(); });
  navigate(false);
})();
