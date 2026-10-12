/* Hub registry and read-only adapters for games with separate local saves. */
(() => {
  'use strict';
  const entries = [
    { id: 'attrape', name: 'Attrape-les-tous' },
    { id: 'breaker', name: 'Breaker Nocturne' },
    { id: 'farm', name: 'Ferme nocturne sous la pleine lune' },
    { id: 'velocity', name: 'Nocturne Velocity' },
    { id: 'shift', name: 'Nocturne Shift' },
    { id: 'nyr', name: 'NYR' },
    { id: 'jetclash', name: 'JetClash' },
    { id: 'lumi', name: 'Lumi' },
    { id: 'runner', name: 'Nocturne Runner' }
  ].map(Object.freeze);
  const storageKeys = ['cjajlkFarmV1', 'nyrStatisticsV1', 'jetclash.etape2.profile.v1', 'lumi-best', 'nocturneRunnerProfileV1', 'nocturneRunnerBest'];
  const record = value => value && typeof value === 'object' && !Array.isArray(value);
  const count = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
  function saved(key) {
    try { const value = JSON.parse(localStorage.getItem(key)); return record(value) ? value : null; }
    catch { return null; }
  }
  function localActivity(id) {
    if (id === 'farm') {
      const data = saved(storageKeys[0]);
      if (record(data?.zones) && count(data.level) >= 1 && typeof data.savedAt === 'number' && Number.isFinite(data.savedAt) && data.savedAt > 0) {
        return { recorded: true, detail: `Sauvegarde de ferme disponible · Niveau ${data.level}` };
      }
    } else if (id === 'nyr') {
      const data = saved(storageKeys[1]), runs = data?.version === 1 ? count(data.totals?.completedRuns) : null;
      if (runs > 0) {
        const score = count(data.totals.bestScore);
        return { recorded: true, detail: `${runs} partie${runs > 1 ? 's' : ''} terminée${runs > 1 ? 's' : ''}${score == null ? '' : ` · Meilleur score : ${score}`}` };
      }
    } else if (id === 'jetclash') {
      const data = saved(storageKeys[2]);
      if (count(data?.xp) !== null && Array.isArray(data?.completed) && data.completed.every(id => typeof id === 'string')) {
        const matches = Math.max(data.completed.length, count(data.stats?.matches) || 0);
        const training = count(data.challenges?.daily?.entries?.['d-training']?.progress) || 0;
        if (matches > 0 || training > 0) return { recorded: true, detail: matches > 0 ? `${matches} match${matches > 1 ? 's' : ''} terminé${matches > 1 ? 's' : ''} · ${data.xp} XP JetClash` : 'Entraînement enregistré' };
      }
    }
    if (id === 'runner') {
      const distance = count(saved('nocturneRunnerProfileV1')?.stats?.distance);
      if (distance > 0) return { recorded: true, detail: 'Distance cumulée : ' + distance + ' m' };
      try {
        const raw = localStorage.getItem('nocturneRunnerBest');
        const best = raw && /^\d+$/.test(raw) ? count(Number(raw)) : null;
        if (best > 0) return { recorded: true, detail: 'Meilleure distance : ' + best + ' m' };
      } catch {}
    }
    if (id === 'lumi') {
      try {
        const raw = localStorage.getItem('lumi-best');
        const score = raw && /^\d+$/.test(raw) ? count(Number(raw)) : null;
        if (score > 0) return { recorded: true, detail: 'Meilleur score : ' + score };
      } catch {}
    }
    return { recorded: false, detail: null };
  }
  window.CJGameCatalog = Object.freeze({ entries: Object.freeze(entries), storageKeys: Object.freeze(storageKeys), localActivity });
})();
