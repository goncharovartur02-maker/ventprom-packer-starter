import { ExcelParser } from '../src/excel';
import { DuctItem } from '@ventprom/core';
import * as fs from 'fs';
import * as path from 'path';

describe('ExcelParser', () => {
  let parser: ExcelParser;

  beforeEach(() => {
    parser = new ExcelParser();
  });

  it('should parse a simple Excel file with rectangular items', async () => {
    // Create a test Excel file content
    const testData = [
      ['ID', 'TYPE', 'W', 'H', 'L', 'QTY', 'WEIGHT'],
      ['R1', 'rect', 500, 300, 1000, 10, 12.3],
      ['R2', 'rect', 400, 200, 800, 5, 8.1],
    ];

    const buffer = await createTestExcelBuffer(testData);
    const items = await parser.parse(buffer);

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      id: 'R1',
      type: 'rect',
      w: 500,
      h: 300,
      length: 1000,
      qty: 10,
      weightKg: 12.3,
    });
    expect(items[1]).toEqual({
      id: 'R2',
      type: 'rect',
      w: 400,
      h: 200,
      length: 800,
      qty: 5,
      weightKg: 8.1,
    });
  });

  it('should parse Excel file with round items', async () => {
    const testData = [
      ['ID', 'TYPE', 'D', 'L', 'QTY'],
      ['C1', 'round', 200, 1000, 3],
      ['C2', 'round', 150, 800, 2],
    ];

    const buffer = await createTestExcelBuffer(testData);
    const items = await parser.parse(buffer);

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      id: 'C1',
      type: 'round',
      d: 200,
      length: 1000,
      qty: 3,
      weightKg: undefined,
    });
  });

  it('should handle Russian column headers', async () => {
    const testData = [
      ['Код', 'Тип', 'Ширина', 'Высота', 'Длина', 'Количество', 'Вес'],
      ['R1', 'rect', 500, 300, 1000, 10, 12.3],
    ];

    const buffer = await createTestExcelBuffer(testData);
    const items = await parser.parse(buffer);

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      id: 'R1',
      type: 'rect',
      w: 500,
      h: 300,
      length: 1000,
      qty: 10,
      weightKg: 12.3,
    });
  });

  it('should handle missing optional fields', async () => {
    const testData = [
      ['ID', 'TYPE', 'L', 'QTY'],
      ['R1', 'rect', 1000, 5],
    ];

    const buffer = await createTestExcelBuffer(testData);
    const items = await parser.parse(buffer);

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      id: 'R1',
      type: 'rect',
      length: 1000,
      qty: 5,
      weightKg: undefined,
    });
  });

  it('should skip rows with invalid data', async () => {
    const testData = [
      ['ID', 'TYPE', 'L', 'QTY'],
      ['R1', 'rect', 1000, 5],
      ['R2', 'rect', 0, 3], // Invalid length
      ['R3', 'rect', 800, 2],
    ];

    const buffer = await createTestExcelBuffer(testData);
    const items = await parser.parse(buffer);

    expect(items).toHaveLength(2); // R2 should be skipped
    expect(items.map(item => item.id)).toEqual(['R1', 'R3']);
  });

  it('should throw error for empty file', async () => {
    const buffer = Buffer.from([]);
    await expect(parser.parse(buffer)).rejects.toThrow('No worksheets found');
  });

  it('should throw error for file with only header', async () => {
    const testData = [['ID', 'TYPE', 'L', 'QTY']];
    const buffer = await createTestExcelBuffer(testData);
    await expect(parser.parse(buffer)).rejects.toThrow('Excel file must have at least a header row and one data row');
  });
});

// Helper function to create Excel buffer for testing
async function createTestExcelBuffer(data: any[][]): Promise<Buffer> {
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Test');
  
  data.forEach(row => {
    worksheet.addRow(row);
  });
  
  return await workbook.xlsx.writeBuffer();
}