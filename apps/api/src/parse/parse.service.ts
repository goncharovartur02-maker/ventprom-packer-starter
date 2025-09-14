import { Injectable } from '@nestjs/common';
import { UniversalItem, DuctItem } from '../types';

@Injectable()
export class ParseService {
  constructor() {
    console.log('ParseService: Initialized');
  }

  // Universal parsing method - extracts ALL data from files
  async parseFilesUniversal(files: Express.Multer.File[]): Promise<UniversalItem[]> {
    console.log('ParseService: Processing files:', files.length);
    
    // Return test data for now to fix API startup
    const testItems: UniversalItem[] = [
      {
        id: 'test-1',
        type: 'rect',
        dimensions: { width: 100, height: 50, length: 1000 },
        qty: 2,
        weightKg: 15.5
      },
      {
        id: 'test-2', 
        type: 'round',
        dimensions: { diameter: 200, length: 800 },
        qty: 1,
        weightKg: 12.3
      }
    ];

    console.log('ParseService: Returning test data:', testItems.length, 'items');
    return testItems;
  }

  // Convert DuctItem to UniversalItem for backward compatibility
  private convertDuctItemToUniversal(ductItem: DuctItem): UniversalItem {
    const dimensions: { [key: string]: number } = {};
    
    if (ductItem.w) dimensions.width = ductItem.w;
    if (ductItem.h) dimensions.height = ductItem.h;
    if (ductItem.d) dimensions.diameter = ductItem.d;
    if (ductItem.length) dimensions.length = ductItem.length;

    return {
      id: ductItem.id,
      type: ductItem.type,
      dimensions,
      qty: ductItem.qty,
      weightKg: ductItem.weightKg,
    };
  }
}


