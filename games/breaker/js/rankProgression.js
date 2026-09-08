// Affichage de la progression des rangs sur la page campagne
(function() {
    // S'assurer d'être sur la page campagne
    if (!document.body.classList.contains('campaign')) return;

    // Ordre des rangs (doit matcher gameplay.js)
    const rankOrder = ["bronze", "argent", "or", "diamant", "platine", "nocturne"];
    const rankLabels = {
        bronze: 'Bronze',
        argent: 'Argent',
        or: 'Or',
        diamant: 'Diamant',
        platine: 'Platine',
        nocturne: 'Nocturne'
    };
    
    // Récupère le profil et la progression
    const profile = JSON.parse(localStorage.getItem('breaker_profile')) || {};
    const rankBossWins = profile.rankBossWins || {};
    const currentRank = localStorage.getItem('breaker_rank') || 'bronze';
    const maxUnlocked = profile.maxUnlockedRank || currentRank;

    // Création du bloc UI
    const container = document.createElement('div');
    container.className = 'rank-progression-campaign';
    container.innerHTML = `<h3 style="color:#a78bfa;font-size:1.2em;margin-bottom:8px;letter-spacing:1px;">Progression des rangs</h3>`;

    rankOrder.forEach((rank, idx) => {
        const wins = rankBossWins[rank] || 0;
        const isUnlocked = rankOrder.indexOf(maxUnlocked) >= idx;
        let status = '';
        if (isUnlocked && idx < rankOrder.length-1) {
            status = (wins >= 2) ? '<span class="rank-status completed">Terminé</span>' : `<span class="rank-status">${wins}/2 boss</span>`;
        } else if (isUnlocked) {
            status = '<span class="rank-status completed">Terminé</span>';
        } else {
            status = '<span class="rank-status locked">Verrouillé</span>';
        }
        container.innerHTML += `
            <div class="rank-row ${isUnlocked ? 'unlocked' : 'locked'}${currentRank===rank?' current':''}">
                <span class="rank-label">${rankLabels[rank]}</span>
                ${status}
            </div>`;
    });

    // Ajout au DOM (sous le header campagne)
    const header = document.querySelector('.campaign-header');
    if (header) {
        header.parentNode.insertBefore(container, header.nextSibling);
    }

    // Style rapide (à intégrer dans le CSS principal si validé)
    const style = document.createElement('style');
    style.textContent = `
    .rank-progression-campaign {
        background: rgba(30,20,50,0.85);
        border-radius: 14px;
        margin: 18px auto 18px auto;
        padding: 18px 24px 10px 24px;
        max-width: 420px;
        box-shadow: 0 2px 16px #0008;
        text-align: left;
    }
    .rank-progression-campaign .rank-row {
        display: flex;
        align-items: center;
        font-size: 1.08em;
        margin-bottom: 7px;
        padding: 3px 0;
    }
    .rank-progression-campaign .rank-label {
        width: 110px;
        font-weight: bold;
        color: #a78bfa;
        letter-spacing: 1px;
    }
    .rank-progression-campaign .rank-status {
        margin-left: 12px;
        font-size: 1em;
        color: #5cc8ff;
        font-weight: 500;
    }
    .rank-progression-campaign .rank-row.completed .rank-status {
        color: #6bffb2;
        font-weight: bold;
    }
    .rank-progression-campaign .rank-row.locked .rank-status {
        color: #888;
    }
    .rank-progression-campaign .rank-row.current .rank-label {
        color: #fff;
        text-shadow: 0 0 8px #a78bfa;
    }
    `;
    document.head.appendChild(style);
})();
