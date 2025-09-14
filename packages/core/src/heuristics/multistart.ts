import { Vehicle, DuctItem, PackingResult } from '../models';
import { BeamSearch } from './beam';
import { LayerRules } from './layer_rules';

export class Multistart {
  private readonly NUM_STARTS = 10; // Number of different starting configurations
  private beamSearch: BeamSearch;
  private layerRules: LayerRules;

  constructor() {
    this.beamSearch = new BeamSearch();
    this.layerRules = new LayerRules();
  }

  search(vehicle: Vehicle, items: DuctItem[], gridSize: number): PackingResult {
    const results: PackingResult[] = [];
    
    // Generate multiple starting configurations
    for (let i = 0; i < this.NUM_STARTS; i++) {
      const shuffledItems = this.shuffleItems([...items], i);
      const result = this.beamSearch.search(vehicle, shuffledItems, gridSize);
      results.push(result);
    }
    
    // Return the best result
    return this.selectBestResult(results);
  }

  private shuffleItems(items: DuctItem[], seed: number): DuctItem[] {
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

  private selectBestResult(results: PackingResult[]): PackingResult {
    return results.reduce((best, current) => {
      const bestScore = this.calculateResultScore(best);
      const currentScore = this.calculateResultScore(current);
      
      return currentScore > bestScore ? current : best;
    });
  }

  private calculateResultScore(result: PackingResult): number {
    // Higher score = better result
    const volumeScore = result.metrics.volumeFill * 100;
    const binsPenalty = result.binsUsed * 10; // Penalty for using more bins
    const stabilityScore = result.metrics.stabilityScore || 0;
    
    return volumeScore + stabilityScore * 50 - binsPenalty;
  }
}
