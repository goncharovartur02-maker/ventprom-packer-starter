import { Injectable } from '@nestjs/common';
import { Vehicle } from '../types';

@Injectable()
export class PresetsService {
  getPresets(): Vehicle[] {
    return [
      {
        id: 'gazel_4m',
        name: 'Газель 4 метра',
        width: 2000,
        height: 1800,
        length: 4200,
        maxPayloadKg: 1500,
      },
      {
        id: 'gazel_6m',
        name: 'Газель 6 метров',
        width: 2000,
        height: 1800,
        length: 6200,
        maxPayloadKg: 2000,
      },
      {
        id: 'polufura_60',
        name: 'Полуфура 60 кубов',
        width: 2450,
        height: 2500,
        length: 10000,
        maxPayloadKg: 15000,
      },
      {
        id: 'fura_90',
        name: 'Фура 90 кубов',
        width: 2450,
        height: 2500,
        length: 14630,
        maxPayloadKg: 20000,
      },
      {
        id: 'fura_120',
        name: 'Фура 120 кубов',
        width: 2450,
        height: 2700,
        length: 16500,
        maxPayloadKg: 22000,
      },
    ];
  }
}







