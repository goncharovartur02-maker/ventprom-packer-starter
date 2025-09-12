import { Injectable } from '@nestjs/common';
import { Vehicle } from '@ventprom/core';

@Injectable()
export class PresetsService {
  getPresets(): Vehicle[] {
    return [
      {
        id: 'fura',
        name: 'Фура',
        width: 2400,
        height: 2500,
        length: 12000,
        maxPayloadKg: 20000,
      },
      {
        id: 'gazel',
        name: 'Газель',
        width: 2000,
        height: 2000,
        length: 3000,
        maxPayloadKg: 1500,
      },
      {
        id: 'kamaz',
        name: 'КАМАЗ',
        width: 2400,
        height: 2500,
        length: 6000,
        maxPayloadKg: 10000,
      },
    ];
  }
}






