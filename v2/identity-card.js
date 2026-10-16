/* Read-only presentation. No acquisition, account changes or persistent flip state. */
(() => {
  'use strict';
  const card = document.getElementById('identity-rotator'), button = document.getElementById('flip-identity-card');
  const front = document.getElementById('identity-front'), back = document.getElementById('identity-back');
  let reversed = false;
  button.addEventListener('click', () => {
    reversed = !reversed; card.classList.toggle('is-reversed', reversed); button.setAttribute('aria-pressed', String(reversed));
    front.setAttribute('aria-hidden', String(reversed)); back.setAttribute('aria-hidden', String(!reversed)); front.inert = reversed; back.inert = !reversed;
    button.setAttribute('aria-label', reversed ? 'Retourner la carte : voir mon identité' : 'Retourner la carte : voir mon parcours');
    document.getElementById('card-side-status').textContent = reversed ? 'Parcours affiché' : 'Identité affichée';
  });
  const node = (tag, text) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; return el; };
  function render() {
    const profile = window.CJDashboardProfile.read(), badges = document.getElementById('home-card-badges'); badges.replaceChildren();
    const acquired = profile.badges || [];
    let receipts = {}; try { receipts = window.CJajlkAccount?.getPlayer()?.items?.unlockedBadges || {}; } catch {}
    const date = id => { const value = receipts[id]?.unlockedAt; return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0; };
    // Display order only; no receipt is written. Equal dates use reverse registration order.
    const recent = acquired.map((id, index) => ({ id, index })).sort((a, b) => date(b.id) - date(a.id) || b.index - a.index).slice(0, 3);
    if (!acquired.length) { const empty = node('p', profile.badges ? 'Tes premiers badges restent à découvrir.' : 'Badges non disponibles.'); empty.className = 'recent-badges-empty'; badges.append(empty); }
    for (const { id } of recent) {
      const badge = node('div'); badge.className = 'recent-badge';
      const item = (window.CJNocturnalBadges || []).find(item => item.id === id);
      const label = CJProfileCatalog.badge(id);
      if (item) { const img = node('img'); img.src = item.src; img.alt = ''; badge.append(img); }
      else if (label !== id && label.includes(' ')) { const icon = node('span', label.split(' ')[0]); icon.className = 'original-badge-icon'; icon.setAttribute('aria-hidden', 'true'); badge.append(icon); }
      badge.append(node('span', item ? item.label : label !== id ? label.substring(label.indexOf(' ') + 1) : label)); badges.append(badge);
    }
    document.getElementById('home-card-more-badges').textContent = acquired.length > 3 ? `+${acquired.length - 3} autres` : '';
  }
  window.addEventListener('cj-profile-render', render); render();
})();
