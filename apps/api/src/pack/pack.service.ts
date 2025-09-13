import { Injectable } from '@nestjs/common';
import { Vehicle, DuctItem, PackResult, Pack3D } from '../../../../packages/core/src';

@Injectable()
export class PackService {
  private packer = new Pack3D();

  async pack(vehicle: Vehicle, items: DuctItem[]): Promise<PackResult> {
    return this.packer.pack(vehicle, items);
  }
}







