import { PdfParser } from '../src/pdf';
import { DuctItem } from '@ventprom/core';

// Mock pdf-parse
jest.mock('pdf-parse', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('PdfParser', () => {
  let parser: PdfParser;
  let mockPdfParse: jest.MockedFunction<any>;

  beforeEach(() => {
    parser = new PdfParser();
    mockPdfParse = require('pdf-parse').default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should parse PDF with table data', async () => {
    const mockText = `ID    TYPE    W    H    L    QTY    WEIGHT
R1    rect    500    300    1000    10    12.3
R2    rect    400    200    800    5    8.1`;

    mockPdfParse.mockResolvedValue({ text: mockText });

    const buffer = Buffer.from('fake pdf content');
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
  });

  it('should parse PDF with semicolon-delimited table', async () => {
    const mockText = `ID;TYPE;W;H;L;QTY;WEIGHT
R1;rect;500;300;1000;10;12.3`;

    mockPdfParse.mockResolvedValue({ text: mockText });

    const buffer = Buffer.from('fake pdf content');
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

  it('should extract dimensions from unstructured text', async () => {
    const mockText = `Some text about ducts.
    Rectangular duct: 500x300x1000 mm
    Another rectangular: 400*200*800
    Round duct: Ø200x1000
    Another round: D150x800`;

    mockPdfParse.mockResolvedValue({ text: mockText });

    const buffer = Buffer.from('fake pdf content');
    const items = await parser.parse(buffer);

    expect(items).toHaveLength(4);
    
    // Check rectangular items
    const rectItems = items.filter(item => item.type === 'rect');
    expect(rectItems).toHaveLength(2);
    expect(rectItems[0]).toEqual({
      id: expect.stringMatching(/^rect_\d+$/),
      type: 'rect',
      w: 500,
      h: 300,
      length: 1000,
      qty: 1,
      weightKg: undefined,
    });

    // Check round items
    const roundItems = items.filter(item => item.type === 'round');
    expect(roundItems).toHaveLength(2);
    expect(roundItems[0]).toEqual({
      id: expect.stringMatching(/^round_\d+$/),
      type: 'round',
      d: 200,
      length: 1000,
      qty: 1,
      weightKg: undefined,
    });
  });

  it('should handle Russian dimension text', async () => {
    const mockText = `Воздуховоды:
    Прямоугольный: 500x300x1000
    Круглый: диаметр 200 длина 1000`;

    mockPdfParse.mockResolvedValue({ text: mockText });

    const buffer = Buffer.from('fake pdf content');
    const items = await parser.parse(buffer);

    expect(items).toHaveLength(2);
    expect(items[0].type).toBe('rect');
    expect(items[1].type).toBe('round');
  });

  it('should return empty array for PDF with no relevant data', async () => {
    const mockText = `This is just some random text without any duct information.`;

    mockPdfParse.mockResolvedValue({ text: mockText });

    const buffer = Buffer.from('fake pdf content');
    const items = await parser.parse(buffer);

    expect(items).toHaveLength(0);
  });

  it('should handle mixed content (table + unstructured)', async () => {
    const mockText = `ID    TYPE    W    H    L    QTY
R1    rect    500    300    1000    10

Additional items mentioned in text:
Rectangular duct: 400x200x800`;

    mockPdfParse.mockResolvedValue({ text: mockText });

    const buffer = Buffer.from('fake pdf content');
    const items = await parser.parse(buffer);

    // Should prioritize table data over unstructured text
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('R1');
  });

  it('should handle PDF parsing errors gracefully', async () => {
    mockPdfParse.mockRejectedValue(new Error('PDF parsing failed'));

    const buffer = Buffer.from('invalid pdf content');
    await expect(parser.parse(buffer)).rejects.toThrow('PDF parsing failed');
  });

  it('should detect header rows correctly', async () => {
    const mockText = `Some random text
ID    TYPE    W    H    L    QTY    WEIGHT
R1    rect    500    300    1000    10    12.3`;

    mockPdfParse.mockResolvedValue({ text: mockText });

    const buffer = Buffer.from('fake pdf content');
    const items = await parser.parse(buffer);

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('R1');
  });

  it('should handle multiple delimiters in table', async () => {
    const mockText = `ID|TYPE|W|H|L|QTY|WEIGHT
R1|rect|500|300|1000|10|12.3`;

    mockPdfParse.mockResolvedValue({ text: mockText });

    const buffer = Buffer.from('fake pdf content');
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
});