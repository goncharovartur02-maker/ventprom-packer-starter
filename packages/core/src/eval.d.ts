import { PackResult, Vehicle, Placement } from './models';
export declare class Evaluator {
    calculateVolumeFill(vehicle: Vehicle, placements: Placement[]): number;
    calculateStabilityScore(placements: Placement[]): number;
    calculateWeightDistribution(placements: Placement[]): number[];
    calculatePackingEfficiency(result: PackResult): number;
    compareResults(result1: PackResult, result2: PackResult): number;
    private getItemDimensions;
    private getItemWeight;
}
export declare function score(result: PackResult): number;
//# sourceMappingURL=eval.d.ts.map