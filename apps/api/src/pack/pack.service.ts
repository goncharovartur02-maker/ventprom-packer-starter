import { Injectable } from '@nestjs/common';
import { Vehicle, DuctItem, PackResult } from '@ventprom/core';
import { Pack3D } from '@ventprom/core';

@Injectable()
export class PackService {
  private packer = new Pack3D();

  async pack(vehicle: Vehicle, items: DuctItem[]): Promise<PackResult> {
    return this.packer.pack(vehicle, items);
  }
}






