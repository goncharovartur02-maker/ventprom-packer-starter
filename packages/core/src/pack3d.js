"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pack3D = void 0;
exports.pack3d = pack3d;
const constraints_1 = require("./constraints");
const beam_1 = require("./heuristics/beam");
const layer_rules_1 = require("./heuristics/layer_rules");
class Pack3D {
    constructor() {
        this.GRID_SIZE = 5; // 5mm grid
        this.beamSearch = new beam_1.BeamSearch();
        this.layerRules = new layer_rules_1.LayerRules();
    }
    pack(vehicle, items) {
        // Expand items by quantity
        const expandedItems = this.expandItems(items);
        // Sort items by layer rules (big items at bottom)
        const sortedItems = this.layerRules.sortForLayering(expandedItems);
        // Use beam search for optimal packing
        const result = this.beamSearch.search(vehicle, sortedItems, this.GRID_SIZE);
        return result;
    }
    expandItems(items) {
        const expanded = [];
        for (const item of items) {
            for (let i = 0; i < item.qty; i++) {
                expanded.push({
                    ...item,
                    id: `${item.id}_${i}`,
                    qty: 1,
                });
            }
        }
        return expanded;
    }
    // Basic FFD (First Fit Decreasing) algorithm
    packBasic(vehicle, items) {
        const expandedItems = this.expandItems(items);
        const sortedItems = this.layerRules.sortForLayering(expandedItems);
        const placements = [];
        const bins = [];
        let currentBin = [];
        for (const item of sortedItems) {
            let placed = false;
            // Try to place in current bin first
            const placement = this.findPlacement(vehicle, item, currentBin);
            if (placement) {
                currentBin.push(placement);
                placements.push(placement);
                placed = true;
            }
            else {
                // Try existing bins
                for (let binIndex = 0; binIndex < bins.length; binIndex++) {
                    const placement = this.findPlacement(vehicle, item, bins[binIndex]);
                    if (placement) {
                        bins[binIndex].push(placement);
                        placements.push(placement);
                        placed = true;
                        break;
                    }
                }
            }
            // If couldn't place in any existing bin, create new bin
            if (!placed) {
                const placement = this.findPlacement(vehicle, item, []);
                if (placement) {
                    currentBin = [placement];
                    bins.push(currentBin);
                    placements.push(placement);
                }
            }
        }
        // Organize by rows and layers
        const rows = this.organizeByRows(placements);
        const metrics = this.calculateMetrics(vehicle, placements);
        return {
            placements,
            binsUsed: bins.length + (currentBin.length > 0 ? 1 : 0),
            rows,
            metrics,
            snapshots: [], // Will be populated by 3D renderer
        };
    }
    findPlacement(vehicle, item, existingPlacements) {
        const orientations = this.getOrientations(item);
        for (const orientation of orientations) {
            const { w, h, l } = orientation;
            // Try all grid positions
            for (let x = 0; x <= vehicle.width - w; x += this.GRID_SIZE) {
                for (let y = 0; y <= vehicle.height - h; y += this.GRID_SIZE) {
                    for (let z = 0; z <= vehicle.length - l; z += this.GRID_SIZE) {
                        const placement = {
                            itemId: item.id,
                            index: 0,
                            x,
                            y,
                            z,
                            rot: orientation.rot,
                            layer: 0,
                            row: 0,
                        };
                        // Check if placement fits and doesn't collide
                        if ((0, constraints_1.fitsWithin)(vehicle, placement, w, h, l) &&
                            !this.hasCollision(placement, w, h, l, existingPlacements)) {
                            return placement;
                        }
                    }
                }
            }
        }
        return null;
    }
    getOrientations(item) {
        const orientations = [];
        if (item.type === 'rect' && item.w && item.h) {
            // 6 orientations for rectangular items
            orientations.push({ w: item.w, h: item.h, l: item.length, rot: [0, 0, 0] }, { w: item.h, h: item.w, l: item.length, rot: [0, 0, 90] }, { w: item.w, h: item.length, l: item.h, rot: [0, 90, 0] }, { w: item.length, h: item.w, l: item.h, rot: [0, 90, 90] }, { w: item.h, h: item.length, l: item.w, rot: [90, 0, 0] }, { w: item.length, h: item.h, l: item.w, rot: [90, 0, 90] });
        }
        else if (item.type === 'round' && item.d) {
            // 2 orientations for round items (diameter is same in all directions)
            orientations.push({ w: item.d, h: item.d, l: item.length, rot: [0, 0, 0] }, { w: item.d, h: item.length, l: item.d, rot: [0, 90, 0] });
        }
        return orientations;
    }
    hasCollision(placement, w, h, l, existingPlacements) {
        for (const existing of existingPlacements) {
            const existingItem = this.getItemDimensions(existing);
            if ((0, constraints_1.collide)(placement, w, h, l, existing, existingItem.w, existingItem.h, existingItem.l)) {
                return true;
            }
        }
        return false;
    }
    getItemDimensions(placement) {
        // This would need to be implemented based on the original item data
        // For now, return default dimensions
        return { w: 100, h: 100, l: 100 };
    }
    organizeByRows(placements) {
        const rows = {};
        for (const placement of placements) {
            const row = Math.floor(placement.z / 1000); // Group by 1m sections
            if (!rows[row]) {
                rows[row] = [];
            }
            rows[row].push(placement);
        }
        return rows;
    }
    calculateMetrics(vehicle, placements) {
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
exports.Pack3D = Pack3D;
// Legacy function for backward compatibility
function pack3d(req) {
    const packer = new Pack3D();
    return packer.pack(req.vehicle, req.items);
}
//# sourceMappingURL=pack3d.js.map