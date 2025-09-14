import { PackRequest, PackResult, Vehicle, DuctItem } from './models';
export declare class Pack3D {
    private readonly GRID_SIZE;
    private beamSearch;
    private layerRules;
    constructor();
    pack(vehicle: Vehicle, items: DuctItem[]): PackResult;
    private expandItems;
    packBasic(vehicle: Vehicle, items: DuctItem[]): PackResult;
    private findPlacement;
    private getOrientations;
    private hasCollision;
    private getItemDimensions;
    private organizeByRows;
    private calculateMetrics;
}
export declare function pack3d(req: PackRequest): PackResult;
//# sourceMappingURL=pack3d.d.ts.map