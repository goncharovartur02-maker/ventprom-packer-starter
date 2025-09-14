import { Injectable } from '@nestjs/common';
import { DuctItem, UniversalItem } from '../../../../packages/core/src';

@Injectable()
export class ParseService {
  private PdfParser: any;
  private ExcelParser: any;

  constructor() {
    try {
      const parsers = require('../../../../packages/parsers/dist');
      this.PdfParser = parsers.PdfParser;
      this.ExcelParser = parsers.ExcelParser;
      console.log('ParseService: Parsers loaded successfully');
    } catch (error) {
      console.error('ParseService: Failed to load parsers:', error);
    }
  }

  // Universal parsing method - extracts ALL data from files
  async parseFilesUniversal(files: Express.Multer.File[]): Promise<UniversalItem[]> {
    console.log('ParseService: Processing files:', files.length);
    const allItems: UniversalItem[] = [];

    for (const file of files) {
      try {
        let items: DuctItem[] = [];

        if (file.mimetype === 'application/pdf' && this.PdfParser) {
          console.log('ParseService: Processing PDF file:', file.originalname);
          const parser = new this.PdfParser();
          items = await parser.parse(file.buffer);
          console.log('ParseService: PDF parsed, found', items.length, 'items');
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && this.ExcelParser) {
          console.log('ParseService: Processing Excel file:', file.originalname);
          const parser = new this.ExcelParser();
          items = await parser.parse(file.buffer);
          console.log('ParseService: Excel parsed, found', items.length, 'items');
        }

        // Convert DuctItem to UniversalItem
        const universalItems = items.map(item => this.convertDuctItemToUniversal(item));
        allItems.push(...universalItems);
      } catch (error) {
        console.error('ParseService: Error parsing file:', file.originalname, error);
      }
    }

    console.log('ParseService: Total items found:', allItems.length);
    return allItems;
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


