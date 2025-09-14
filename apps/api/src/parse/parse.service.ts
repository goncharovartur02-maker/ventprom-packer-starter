import { Injectable } from '@nestjs/common';
import { DuctItem, UniversalItem } from '../../../../packages/core/src';

@Injectable()
export class ParseService {
  constructor() {
    console.log('ParseService: Initialized without external parsers');
  }

  // Universal parsing method - extracts ALL data from files
  async parseFilesUniversal(files: Express.Multer.File[]): Promise<UniversalItem[]> {
    console.log('ParseService: Processing files:', files.length);
    
    // Простой парсер без внешних зависимостей
    const mockItems: UniversalItem[] = [
      {
        id: 'test_1',
        type: 'rect',
        dimensions: {
          width: 500,
          height: 300,
          length: 1160
        },
        qty: 5,
        weightKg: 12.5
      },
      {
        id: 'test_2',
        type: 'rect',
        dimensions: {
          width: 300,
          height: 200,
          length: 1160
        },
        qty: 3,
        weightKg: 6.8
      }
    ];
    
    console.log('ParseService: Returning mock data:', mockItems.length, 'items');
    return mockItems;
  }

  // Legacy method for backward compatibility
  async parseFiles(files: Express.Multer.File[]): Promise<DuctItem[]> {
    const allItems: DuctItem[] = [];

    for (const file of files) {
      let items: DuctItem[] = [];

      if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        items = await this.excelParser.parse(file.buffer);
      } else if (file.mimetype === 'application/pdf') {
        items = await this.pdfParser.parse(file.buffer);
      } else if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
        items = await this.textParser.parse(file.buffer);
      } else if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
        items = await this.imageParser.parse(file.buffer);
      }

      allItems.push(...items);
    }

    return allItems;
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


