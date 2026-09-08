import BossBase from './bossBase.js';

export default class AstralGuardian extends BossBase {
    update(remainingBricks) {
        super.update(remainingBricks);
        // Ajoute ici toute logique spécifique à AstralGuardian si besoin
    }
    onPhaseChange(phase) {
        if (phase === 2) {
            if (this.game.invertGravity) this.game.invertGravity();
            if (this.game.showBossMessage) this.game.showBossMessage('astralPhase2');
            // Bonus : inverser la balle si méthode dispo
            if (this.game.invertBallDirection) this.game.invertBallDirection();
        } else if (phase === 3) {
            if (this.game.activateCosmicCore) this.game.activateCosmicCore();
            if (this.game.showBossMessage) this.game.showBossMessage('astralPhase3');
        }
    }

    onBrickDestroyed() {
        // Patterns ou effets cosmiques
    }

    onVictory() {
        this.game.addDiamonds(10);
        this.game.addXP(500);
        this.game.showBossMessage('astralVictory');
    }
}
