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
  const time = n => n == null ? 'Temps non enregistré' : n < 60 ? `${Math.floor(n)} s actives` : `${Math.floor(n / 3600)} h ${Math.floor(n % 3600 / 60)} min`;
  function render() {
    const profile = window.CJDashboardProfile.read(), badges = document.getElementById('home-card-badges'), activity = document.getElementById('home-card-activity'); badges.replaceChildren(); activity.replaceChildren();
    const acquired = profile.badges || []; if (!acquired.length) badges.append(node('span', profile.badges ? 'Tes premiers badges restent à découvrir.' : 'Badges non disponibles.'));
    const prominent = profile.selected ? [profile.selected, ...acquired.filter(id => id !== profile.selected)] : acquired;
    for (const id of prominent.slice(0, 3)) { const badge = node('span', CJProfileCatalog.badge(id)); badge.className = 'pill'; badges.append(badge); }
    if (acquired.length > 3) badges.append(node('small', `+${acquired.length - 3} dans le Profil`));
    const games = (profile.games || []).filter(game => game.recorded);
    if (!games.length) activity.append(node('p', 'Chaque aventure commence par une première partie.'));
    for (const game of games.slice(0, 4)) { const row = node('div'); row.append(node('strong', game.name), node('span', time(game.seconds))); if (game.detail) row.append(node('small', game.detail)); activity.append(row); }
    if (games.length > 4) activity.append(node('small', `${games.length - 4} autres jeux à retrouver dans Aventures.`));
  }
  window.addEventListener('cj-profile-render', render); render();
})();
