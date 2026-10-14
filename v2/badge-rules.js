/* Pure, read-only rules. No grants, storage access, dates inferred or CJ operations. */
(() => {
  'use strict';
  const discovery = [3, 6, 9, 12, 20], hours = [5, 20, 50, 100, 200];
  const loyalty = [[1, 10, 5], [3, 35, 15], [5, 75, 30], [8, 130, 50], [12, 250, 80]];
  const rules = Array.from({ length: 15 }, (_, i) => Object.freeze({
    id: `nocturne_badge_${String(i + 1).padStart(2, '0')}`, activation: false,
    family: i < 5 ? 'discovery' : i < 10 ? 'time' : 'loyalty',
    ...(i < 5 ? { games: discovery[i], seconds: 3600 } : i < 10 ? { seconds: hours[i - 5] * 3600 } : { months: loyalty[i - 10][0], seconds: loyalty[i - 10][1] * 3600, days: loyalty[i - 10][2] })
  }));
  const nonnegative = n => Number.isSafeInteger(n) && n >= 0;
  function evidence(player) {
    const time = player?.stats?.playTime, map = time?.byGame;
    const validMap = map && typeof map === 'object' && !Array.isArray(map) && Object.entries(map).every(([id, n]) => /^[a-z][a-z0-9_-]*$/.test(id) && nonnegative(n));
    const validTotal = nonnegative(time?.totalSeconds) && validMap && Object.values(map).reduce((sum, n) => sum + n, 0) <= time.totalSeconds;
    return { seconds: validTotal ? time.totalSeconds : null,
      games: validTotal ? Object.keys(map).filter(id => map[id] > 0).length : null };
  }
  function evaluate(rule, data, certified = null) {
    if (!rule) return null;
    const known = data.seconds !== null && (rule.family !== 'discovery' || data.games !== null);
    // Future server evidence must explicitly certify both calendar age and distinct active days.
    const server = certified?.trusted === true && nonnegative(certified.months) && nonnegative(certified.days);
    const eligible = !known || (rule.family === 'loyalty' && !server) ? null :
      data.seconds >= rule.seconds && (rule.family !== 'discovery' || data.games >= rule.games) &&
      (rule.family !== 'loyalty' || (certified.months >= rule.months && certified.days >= rule.days));
    return { eligible, activation: false };
  }
  function description(id, player) {
    const rule = rules.find(r => r.id === id); if (!rule) return null;
    const condition = rule.family === 'discovery' ? `Jouer réellement à ${rule.games} jeux différents et cumuler au moins 1 heure active.` :
      rule.family === 'time' ? `Cumuler ${rule.seconds / 3600} heures de jeu actif.` :
      `${rule.months} mois d’ancienneté certifiée, ${rule.seconds / 3600} heures actives et ${rule.days} jours actifs distincts.`;
    const data = evidence(player);
    // Discovery evidence is incomplete across native adapters and historical aliases: no progress displayed.
    const progress = rule.family === 'time' && data.seconds !== null ? ` Temps total enregistré : ${Math.floor(data.seconds / 3600)} h ${Math.floor(data.seconds % 3600 / 60)} min sur ${rule.seconds / 3600} h.` : '';
    return condition + progress + (rule.family === 'loyalty' ? ' Suivi en préparation.' : ' Acquisition non activée · Persistance à valider.');
  }
  window.CJBadgeRules = Object.freeze({ rules: Object.freeze(rules), evidence, evaluate, description });
})();
