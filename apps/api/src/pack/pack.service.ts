import { Injectable } from '@nestjs/common';
import { Vehicle, DuctItem, PackResult } from '../types';

@Injectable()
export class PackService {
  async pack(vehicle: Vehicle, items: DuctItem[]): Promise<PackResult> {
    // Simple packing logic for now
    const totalWeight = items.reduce((sum, item) => sum + (item.weightKg * item.qty), 0);
    const utilization = (totalWeight / vehicle.maxPayloadKg) * 100;
    
    return {
      success: true,
      items,
      vehicle,
      totalWeight,
      utilization,
      message: `Packed ${items.length} items with ${utilization.toFixed(1)}% utilization`
    };
  }
}







