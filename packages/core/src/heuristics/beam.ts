import { Vehicle, DuctItem, Placement, PackResult, MM } from '../models';
import { fitsWithin, collide } from '../constraints';

interface PackingState {
  placements: Placement[];
  remainingItems: DuctItem[];
  binsUsed: number;
  score: number;
}

export class BeamSearch {
  private readonly BEAM_WIDTH = 5; // k=5 as specified
  private readonly GRID_SIZE: MM = 5;

  search(vehicle: Vehicle, items: DuctItem[], gridSize: MM): PackResult {
    const initialState: PackingState = {
      placements: [],
      remainingItems: [...items],
      binsUsed: 0,
      score: 0,
    };

    let beam: PackingState[] = [initialState];
    
    // Process items one by one
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const newBeam: PackingState[] = [];
      
      for (const state of beam) {
        const nextItem = state.remainingItems[0];
        if (!nextItem) continue;
        
        // Try to place the item in different positions
        const possiblePlacements = this.findPossiblePlacements(vehicle, nextItem, state.placements, gridSize);
        
        for (const placement of possiblePlacements) {
          const newState = this.createNewState(state, placement, nextItem);
          newBeam.push(newState);
        }
        
        // Also try creating a new bin if current bin is full
        if (state.placements.length > 0) {
          const newBinPlacement = this.findPlacementInNewBin(vehicle, nextItem, gridSize);
          if (newBinPlacement) {
            const newState = this.createNewStateWithNewBin(state, newBinPlacement, nextItem);
            newBeam.push(newState);
          }
        }
      }
      
      // Keep only the best k states
      beam = this.selectBestStates(newBeam, this.BEAM_WIDTH);
    }
    
    // Return the best final state
    const bestState = beam[0];
    if (!bestState) {
      throw new Error('No valid packing found');
    }
    
    return this.stateToPackResult(bestState, vehicle);
  }

  private findPossiblePlacements(
    vehicle: Vehicle, 
    item: DuctItem, 
    existingPlacements: Placement[], 
    gridSize: MM
  ): Placement[] {
    const placements: Placement[] = [];
    const orientations = this.getOrientations(item);
    
    for (const orientation of orientations) {
      const { w, h, l } = orientation;
      
      // Try all grid positions
      for (let x = 0; x <= vehicle.width - w; x += gridSize) {
        for (let y = 0; y <= vehicle.height - h; y += gridSize) {
          for (let z = 0; z <= vehicle.length - l; z += gridSize) {
            const placement: Placement = {
              itemId: item.id,
              index: 0,
              x,
              y,
              z,
              rot: orientation.rot,
              layer: 0,
              row: 0,
            };
            
            if (fitsWithin(vehicle, placement, w, h, l) && 
                !this.hasCollision(placement, w, h, l, existingPlacements)) {
              placements.push(placement);
            }
          }
        }
      }
    }
    
    return placements;
  }

  private findPlacementInNewBin(vehicle: Vehicle, item: DuctItem, gridSize: MM): Placement | null {
    const orientations = this.getOrientations(item);
    
    for (const orientation of orientations) {
      const { w, h, l } = orientation;
      
      // Try placing at origin of new bin
      const placement: Placement = {
        itemId: item.id,
        index: 0,
        x: 0,
        y: 0,
        z: 0,
        rot: orientation.rot,
        layer: 0,
        row: 0,
      };
      
      if (fitsWithin(vehicle, placement, w, h, l)) {
        return placement;
      }
    }
    
    return null;
  }

  private createNewState(
    currentState: PackingState, 
    placement: Placement, 
    item: DuctItem
  ): PackingState {
    const newPlacements = [...currentState.placements, placement];
    const newRemainingItems = currentState.remainingItems.slice(1);
    const newScore = this.calculateScore(newPlacements, newRemainingItems);
    
    return {
      placements: newPlacements,
      remainingItems: newRemainingItems,
      binsUsed: currentState.binsUsed,
      score: newScore,
    };
  }

  private createNewStateWithNewBin(
    currentState: PackingState, 
    placement: Placement, 
    item: DuctItem
  ): PackingState {
    const newPlacements = [...currentState.placements, placement];
    const newRemainingItems = currentState.remainingItems.slice(1);
    const newScore = this.calculateScore(newPlacements, newRemainingItems);
    
    return {
      placements: newPlacements,
      remainingItems: newRemainingItems,
      binsUsed: currentState.binsUsed + 1,
      score: newScore,
    };
  }

  private selectBestStates(states: PackingState[], count: number): PackingState[] {
    return states
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  private calculateScore(placements: Placement[], remainingItems: DuctItem[]): number {
    // Higher score = better packing
    const volumeUtilization = this.calculateVolumeUtilization(placements);
    const stabilityScore = this.calculateStabilityScore(placements);
    const remainingPenalty = remainingItems.length * 1000; // Penalty for unplaced items
    
    return volumeUtilization * 100 + stabilityScore * 50 - remainingPenalty;
  }

  private calculateVolumeUtilization(placements: Placement[]): number {
    if (placements.length === 0) return 0;
    
    // This is a simplified calculation
    // In a real implementation, you'd calculate actual volume utilization
    return placements.length / 100; // Normalize to 0-1 range
  }

  private calculateStabilityScore(placements: Placement[]): number {
    if (placements.length === 0) return 0;
    
    // Calculate how well items are stacked (lower center of gravity = better)
    const avgHeight = placements.reduce((sum, p) => sum + p.y, 0) / placements.length;
    return 1 / (1 + avgHeight / 1000); // Normalize to 0-1 range
  }

  private getOrientations(item: DuctItem): Array<{ w: MM; h: MM; l: MM; rot: [0|90, 0|90, 0|90] }> {
    const orientations: Array<{ w: MM; h: MM; l: MM; rot: [0|90, 0|90, 0|90] }> = [];
    
    if (item.type === 'rect' && item.w && item.h) {
      orientations.push(
        { w: item.w, h: item.h, l: item.length, rot: [0, 0, 0] },
        { w: item.h, h: item.w, l: item.length, rot: [0, 0, 90] },
        { w: item.w, h: item.length, l: item.h, rot: [0, 90, 0] },
        { w: item.length, h: item.w, l: item.h, rot: [0, 90, 90] },
        { w: item.h, h: item.length, l: item.w, rot: [90, 0, 0] },
        { w: item.length, h: item.h, l: item.w, rot: [90, 0, 90] },
      );
    } else if (item.type === 'round' && item.d) {
      orientations.push(
        { w: item.d, h: item.d, l: item.length, rot: [0, 0, 0] },
        { w: item.d, h: item.length, l: item.d, rot: [0, 90, 0] },
      );
    }
    
    return orientations;
  }

  private hasCollision(
    placement: Placement, 
    w: MM, h: MM, l: MM, 
    existingPlacements: Placement[]
  ): boolean {
    for (const existing of existingPlacements) {
      const existingItem = this.getItemDimensions(existing);
      if (collide(placement, w, h, l, existing, existingItem.w, existingItem.h, existingItem.l)) {
        return true;
      }
    }
    return false;
  }

  private getItemDimensions(placement: Placement): { w: MM; h: MM; l: MM } {
    // This would need to be implemented based on the original item data
    // For now, return default dimensions
    return { w: 100, h: 100, l: 100 };
  }

  private stateToPackResult(state: PackingState, vehicle: Vehicle): PackResult {
    const rows = this.organizeByRows(state.placements);
    const metrics = this.calculateMetrics(vehicle, state.placements);
    
    return {
      placements: state.placements,
      binsUsed: state.binsUsed + 1, // +1 for the current bin
      rows,
      metrics,
      snapshots: [], // Will be populated by 3D renderer
    };
  }

  private organizeByRows(placements: Placement[]): Record<number, Placement[]> {
    const rows: Record<number, Placement[]> = {};
    
    for (const placement of placements) {
      const row = Math.floor(placement.z / 1000); // Group by 1m sections
      if (!rows[row]) {
        rows[row] = [];
      }
      rows[row].push(placement);
    }
    
    return rows;
  }

  private calculateMetrics(vehicle: Vehicle, placements: Placement[]): PackResult['metrics'] {
    const vehicleVolume = vehicle.width * vehicle.height * vehicle.length;
    let usedVolume = 0;
    
    for (const placement of placements) {
      const dims = this.getItemDimensions(placement);
      usedVolume += dims.w * dims.h * dims.l;
    }
    
    return {
      volumeFill: usedVolume / vehicleVolume,
    };
  }
}
