"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Multistart = void 0;
const beam_1 = require("./beam");
const layer_rules_1 = require("./layer_rules");
class Multistart {
    constructor() {
        this.NUM_STARTS = 10; // Number of different starting configurations
        this.beamSearch = new beam_1.BeamSearch();
        this.layerRules = new layer_rules_1.LayerRules();
    }
    search(vehicle, items, gridSize) {
        const results = [];
        // Generate multiple starting configurations
        for (let i = 0; i < this.NUM_STARTS; i++) {
            const shuffledItems = this.shuffleItems([...items], i);
            const result = this.beamSearch.search(vehicle, shuffledItems, gridSize);
            results.push(result);
        }
        // Return the best result
        return this.selectBestResult(results);
    }
    shuffleItems(items, seed) {
        // Use seed for reproducible shuffling
        const shuffled = [...items];
        // Simple shuffle algorithm with seed
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = (seed + i) % (i + 1);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // Apply layer rules after shuffling
        return this.layerRules.sortForLayering(shuffled);
    }
    selectBestResult(results) {
        return results.reduce((best, current) => {
            const bestScore = this.calculateResultScore(best);
            const currentScore = this.calculateResultScore(current);
            return currentScore > bestScore ? current : best;
        });
    }
    calculateResultScore(result) {
        // Higher score = better result
        const volumeScore = result.metrics.volumeFill * 100;
        const binsPenalty = result.binsUsed * 10; // Penalty for using more bins
        const stabilityScore = result.metrics.stabilityScore || 0;
        return volumeScore + stabilityScore * 50 - binsPenalty;
    }
}
exports.Multistart = Multistart;
//# sourceMappingURL=multistart.js.map