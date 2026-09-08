import CityGuardian from './cityGuardian.js';
import AstralGuardian from './astralGuardian.js';

export function createBoss(type, game) {
    switch(type) {
        case 'astral_guardian':
            return new AstralGuardian(game);
        case 'city_guardian':
        default:
            return new CityGuardian(game);
    }
}
