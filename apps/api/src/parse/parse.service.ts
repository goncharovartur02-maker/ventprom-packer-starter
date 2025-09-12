import { Injectable } from '@nestjs/common';
import { DuctItem, UniversalItem } from '@ventprom/core';
import { ExcelParser, PdfParser, TextParser, ImageParser } from '@ventprom/parsers';

@Injectable()
export class ParseService {
  private excelParser = new ExcelParser();
  private pdfParser = new PdfParser();
  private textParser = new TextParser();
  private imageParser = new ImageParser();

  // Universal parsing method - extracts ALL data from files
  async parseFilesUniversal(files: Express.Multer.File[]): Promise<UniversalItem[]> {
    const allItems: UniversalItem[] = [];

    for (const file of files) {
      let items: UniversalItem[] = [];

      if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        items = await this.excelParser.parseUniversal(file.buffer);
      } else if (file.mimetype === 'application/pdf') {
        // TODO: Implement universal PDF parsing
        items = await this.pdfParser.parse(file.buffer).then(ductItems => 
          ductItems.map(item => this.convertDuctItemToUniversal(item))
        );
      } else if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
        // TODO: Implement universal text parsing
        items = await this.textParser.parse(file.buffer).then(ductItems => 
          ductItems.map(item => this.convertDuctItemToUniversal(item))
        );
      } else if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
        // TODO: Implement universal image parsing
        items = await this.imageParser.parse(file.buffer).then(ductItems => 
          ductItems.map(item => this.convertDuctItemToUniversal(item))
        );
      }

      allItems.push(...items);
    }

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


