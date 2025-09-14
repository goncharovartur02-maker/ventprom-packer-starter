import { DuctItem } from '../models';
export declare class LayerRules {
    sortForLayering(items: DuctItem[]): DuctItem[];
    private calculateItemScore;
    private getBaseArea;
    private getVolume;
    canStackOnTop(bottomItem: DuctItem, topItem: DuctItem): boolean;
    calculateLayerStability(items: DuctItem[]): number;
    groupIntoLayers(items: DuctItem[]): DuctItem[][];
}
//# sourceMappingURL=layer_rules.d.ts.map