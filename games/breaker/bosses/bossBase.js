// Classe de base pour tous les boss Breaker
export default class BossBase {
    constructor(game) {
        this.game = game;
        this.phase = 1;
        this.totalBricks = 0;
        this.lastPhase = 1;
    }

    init(totalBricks) {
        this.totalBricks = totalBricks;
        this.phase = 1;
        this.lastPhase = 1;
        console.log(`[BOSSBASE][init] totalBricks set to`, totalBricks);
    }

    update(bricksRemaining) {
        if (!this.totalBricks) {
            console.warn('[BOSSBASE][update] totalBricks is falsy!', this.totalBricks);
            return;
        }
        const percent = bricksRemaining / this.totalBricks;
        console.log(`[BOSSBASE][update] bricksRemaining: ${bricksRemaining}, totalBricks: ${this.totalBricks}, percent: ${(percent*100).toFixed(1)}%, phase: ${this.phase}`);
        if (this.phase < 2 && percent <= 0.66) {
            console.log('[BOSSBASE][update] Passage phase 2');
            this.phase = 2;
            this.onPhaseChange(2);
        }
        if (this.phase < 3 && percent <= 0.33) {
            console.log('[BOSSBASE][update] Passage phase 3');
            this.phase = 3;
            this.onPhaseChange(3);
        }
    }

    onPhaseChange(phase) {
        // À surcharger dans les sous-classes
    }

    onBrickDestroyed() {
        // Hook à surcharger
    }

    onVictory() {
        // Hook à surcharger
    }
}