import BossBase from './bossBase.js';

export default class CityGuardian extends BossBase {
    onPhaseChange(phase) {
        if (phase === 2) {
            this.game.setBossSpeed(2.5);
            this.game.flashScreen('warning');
            if (this.game.showBossMessage) this.game.showBossMessage('cityPhase2');
        } else if (phase === 3) {
            this.game.setBossSpeed(3.5);
            this.game.flashScreen('danger');
            if (this.game.showBossMessage) this.game.showBossMessage('cityPhase3');
        }
    }

    update(remainingBricks) {
        super.update(remainingBricks);
        // Récupérer les briques depuis le jeu principal
        const bricks = this.game.getBricks ? this.game.getBricks() : [];
        const canvas = this.game.getCanvas ? this.game.getCanvas() : null;
        if (!bricks || !canvas) return;

        let hitWall = false;
        for (let b of bricks) {
            if (!b.destroyed) {
                if (b.x <= 0 || b.x + b.w >= canvas.width) {
                    hitWall = true;
                    break;
                }
            }
        }

        if (hitWall) {
            if (typeof this.direction !== 'number') this.direction = 1;
            this.direction *= -1;
        }

        if (typeof this.direction !== 'number') this.direction = 1;
        const speed = typeof this.speed === 'number' ? this.speed : (this.game.getBossSpeed ? this.game.getBossSpeed() : 1.5);
        for (let b of bricks) {
            if (!b.destroyed) {
                b.x += this.direction * speed;
            }
        }
    }
    onBrickDestroyed() {
        // Patterns ou effets visuels spécifiques
    }

    onVictory() {
        this.game.addDiamonds(10);
        this.game.addXP(500);
        this.game.showBossMessage('cityVictory');
    }
}
