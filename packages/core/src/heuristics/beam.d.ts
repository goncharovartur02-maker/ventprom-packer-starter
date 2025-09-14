import { Vehicle, DuctItem, PackResult, MM } from '../models';
export declare class BeamSearch {
    private readonly BEAM_WIDTH;
    private readonly GRID_SIZE;
    search(vehicle: Vehicle, items: DuctItem[], gridSize: MM): PackResult;
    private findPossiblePlacements;
    private findPlacementInNewBin;
    private createNewState;
    private createNewStateWithNewBin;
    private selectBestStates;
    private calculateScore;
    private calculateVolumeUtilization;
    private calculateStabilityScore;
    private getOrientations;
    private hasCollision;
    private getItemDimensions;
    private stateToPackResult;
    private organizeByRows;
    private calculateMetrics;
}
//# sourceMappingURL=beam.d.ts.map