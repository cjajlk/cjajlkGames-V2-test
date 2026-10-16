/* Read-only projection of existing evidence. No grants, storage writes or native script imports. */
(() => {
  'use strict';
  const keys = ['campaignProgress', 'nyrWeeklyChallengesV1', 'nocturneShiftLocalProfileV1', 'nv_player_stats', 'nocturneRunnerV1Data'];
  const record = value => value && typeof value === 'object' && !Array.isArray(value);
  const number = value => Number.isSafeInteger(value) && value >= 0;
  const own = (value, key) => record(value) && Object.hasOwn(value, key);
  const part = (label, value, target, reason = '') => ({ label, value, target, reason, done: value === null ? null : value >= target });
  function project(player, native = {}, registry = []) {
    const time = player?.stats?.playTime;
    const map = record(time?.byGame) ? time.byGame : null;
    const valid = map && Object.values(map).every(number) && number(time.totalSeconds) && Object.values(map).reduce((sum, n) => sum + n, 0) <= time.totalSeconds;
    const seconds = valid ? time.totalSeconds : null;
    const ids = new Set(registry.map(game => game.id));
    const aliases = { 'nocturne-velocity': 'velocity', 'nocturne-shift': 'shift', 'nocturne-runner': 'runner' };
    const played = new Set(); let unknown = false;
    if (valid) for (const [id, duration] of Object.entries(map)) {
      if (!duration) continue;
      const canonical = aliases[id] || id;
      if (ids.has(canonical)) played.add(canonical); else unknown = true;
    }
    const discovery = part('Jeux distincts avec temps actif enregistré', valid ? played.size : null, 0,
      unknown ? 'Identifiants non reconnus exclus du compte ; historique potentiellement incomplet.' : 'Un jeu sans temps actif enregistré ne compte pas ; les historiques effacés ne sont pas reconstruits.');
    const weekly = native.nyrWeeklyChallengesV1;
    const story = weekly?.version === 1 && record(weekly.story) ? weekly.story : null;
    const flag = (object, key) => own(object, key) && typeof object[key] === 'boolean' ? Number(object[key]) : null;
    // A native objective map is sparse: absence is no recorded proof, not invented failure history.
    const marker = (object, key) => record(object) ? (!own(object, key) ? 0 : typeof object[key] === 'boolean' ? Number(object[key]) : null) : null;
    const nyrFinish = part('NYR · chapitre IV terminé', flag(story, 'completed'), 1);
    const stability = part('NYR · objectif chapitre IV, stabilité ≥75', marker(story?.rewarded, '4:stability'), 1);
    if (stability.done === true && nyrFinish.done !== true) { stability.value = null; stability.done = null; stability.reason = 'Preuves de chapitre incohérentes.'; }
    const survival = part('NYR · cycle de Survie enregistré', weekly?.version === 1 ? marker(weekly.survival, 'cycle') : null, 1);
    const shift = native.nocturneShiftLocalProfileV1;
    const comboValue = shift?.version === 1 && number(shift.stats?.bestCombo) && shift.stats.bestCombo <= 8 ? shift.stats.bestCombo : null;
    const combo = part('Shift · meilleur combo', comboValue, 8);
    const velocity = native.nv_player_stats;
    let hardcore = number(velocity?.worldsReachedHardcore) ? velocity.worldsReachedHardcore : null;
    if (typeof velocity?.hardcoreCompleted !== 'boolean' || (hardcore !== null && velocity.hardcoreCompleted !== (hardcore >= 4))) hardcore = null;
    const world = part('Velocity · monde atteint en Hardcore', hardcore, 4);
    const runner = native.nocturneRunnerV1Data;
    const words = part('Runner · mots complétés', runner?.schema === 1 && number(runner.word?.completed) ? runner.word.completed : null, 20);
    const campaign = native.campaignProgress;
    let levels = 0, campaignValid = record(campaign);
    for (const id of ['nuit_calme', 'foret_nocturne', 'cite_astrale', 'abysse_nocturne']) {
      const values = campaign?.[id]?.levels;
      if (!Array.isArray(values) || values.length !== 5 || !values.every(value => typeof value === 'boolean')) campaignValid = false;
      else levels += values.filter(value => value === true).length;
    }
    const attrape = part('Attrape-les-tous · niveaux de campagne terminés', campaignValid ? levels : null, 20);
    const all = parts => parts.every(p => p.done === true) ? true : parts.some(p => p.done === false) ? false : null;
    const count = (label, parts, target) => part(label, parts.filter(p => p.done === true).length, target,
      parts.some(p => p.done === null) ? 'Certaines preuves sont indisponibles ; le compte affiché est un minimum confirmé.' : 'Parcours terminés enregistrés, un seul compte par jeu.');
    const nyrMaster = part('NYR · chapitre IV ET cycle Survie', all([nyrFinish, survival]) === null ? null : Number(all([nyrFinish, survival])), 1);
    return (window.CJNocturnalBadges || []).map(item => {
      const index = Number(item.id.slice(-2)); let parts = [], condition = '', eligible = null, waiting = false;
      if (index <= 15) {
        const rule = window.CJBadgeRules.rules.find(r => r.id === item.id);
        condition = window.CJBadgeRules.description(item.id, null).split(' Acquisition non activée')[0].replace(' Suivi en préparation.', '');
        if (index <= 5) parts = [{ ...discovery, target: rule.games, done: discovery.value === null ? null : discovery.value >= rule.games }, part('Temps actif total (secondes)', seconds, 3600)];
        else if (index <= 10) parts = [part('Temps actif total (secondes)', seconds, rule.seconds)];
        else { parts = [part('Ancienneté certifiée (mois)', null, rule.months), part('Temps actif total (secondes)', seconds, rule.seconds), part('Jours actifs distincts certifiés', null, rule.days)]; waiting = true; }
        eligible = waiting ? null : all(parts);
      } else if (index === 16) {
        condition = 'Terminer le chapitre IV de NYR avec au moins 75 de stabilité ET atteindre un combo ×8 dans Shift.';
        parts = [stability, combo]; eligible = all(parts);
      } else if (index === 17) {
        condition = 'Terminer deux parcours dans deux jeux parmi : Attrape (20 niveaux), NYR (chapitre IV), Runner (20 mots).';
        parts = [count('Jeux avec parcours terminé', [attrape, nyrFinish, words], 2), attrape, nyrFinish, words];
        eligible = parts[0].done ? true : [attrape, nyrFinish, words].some(p => p.done === null) ? null : false;
      } else if (index === 18) {
        condition = 'Réussir un cycle de Survie NYR OU atteindre le monde 4 en Hardcore dans Velocity.';
        parts = [survival, world]; eligible = parts.some(p => p.done === true) ? true : parts.some(p => p.done === null) ? null : false;
      } else if (index === 19) {
        condition = 'Réussir quatre parcours dans quatre jeux : Attrape (20 niveaux), Velocity (monde 4 Hardcore), Shift (×8), NYR (chapitre IV ET cycle Survie), Runner (20 mots).';
        const paths = [attrape, world, combo, nyrMaster, words];
        parts = [count('Jeux maîtrisés', paths, 4), ...paths];
        eligible = parts[0].done ? true : paths.some(p => p.done === null) ? null : false;
      } else { condition = 'Mythe Vivant · conception en attente de validation finale. Aucun parcours JetClash activé.'; waiting = true; }
      const acquisition = player?.items?.unlockedBadges;
      const obtained = own(acquisition, item.id) && !!acquisition[item.id] && (acquisition[item.id] === true || record(acquisition[item.id]));
      const unavailable = waiting || parts.some(p => p.value === null);
      const activation = !!window.CJBadgeAcquisitions?.enabled(item.id);
      return { id: item.id, condition, parts, eligible, obtained, activation,
        status: obtained ? 'Obtenu · acquisition enregistrée' : eligible === true ? activation ? 'Conditions remplies · enregistrement à confirmer' : 'Conditions remplies · attribution désactivée' : unavailable ? 'Suivi indisponible ou partiel' : 'Verrouillé · suivi disponible',
        note: waiting ? index === 20 ? 'En conception · aucune acquisition.' : 'Suivi serveur en préparation : ancienneté et jours actifs indisponibles.' : activation ? window.CJBadgeAcquisitions.error || 'Acquisition automatique vérifiée · conservée dans ce navigateur, sans gain de CJ.' : 'Lecture seule · aucune attribution automatique. Une preuve effacée ne peut pas être reconstituée.',
        percent: eligible === true ? 100 : null };
    });
  }
  function read(account) {
    let player = account || null; try { if (!account) player = window.CJajlkAccount?.getPlayer(); } catch {}
    const native = {}; for (const key of keys) try { const raw = localStorage.getItem(key); native[key] = raw === null ? null : JSON.parse(raw); } catch { native[key] = null; }
    return project(player, native, window.CJGameCatalog?.entries || []);
  }
  window.CJBadgeProgress = Object.freeze({ read, project, keys: Object.freeze(keys) });
  window.addEventListener('storage', event => { if (keys.includes(event.key) || event.key === null) window.dispatchEvent(new Event('cj-badge-progress')); });
})();
