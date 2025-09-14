import { Vehicle, DuctItem, PackResult } from '../models';
export declare class Multistart {
    private readonly NUM_STARTS;
    private beamSearch;
    private layerRules;
    constructor();
    search(vehicle: Vehicle, items: DuctItem[], gridSize: number): PackResult;
    private shuffleItems;
    private selectBestResult;
    private calculateResultScore;
}
//# sourceMappingURL=multistart.d.ts.map