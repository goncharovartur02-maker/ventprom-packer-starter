# Image Parser for Ventprom Packer

## Overview

The Image Parser adds OCR (Optical Character Recognition) capabilities to extract duct information from image files (PNG, JPG, JPEG). This allows users to upload photos or scanned documents containing duct specifications.

## Technology Stack

### **Tesseract.js**
- **Library**: `tesseract.js` v5.0.2
- **Languages**: English + Russian (`eng+rus`)
- **Features**: 
  - High accuracy OCR
  - Multi-language support
  - Handles various image formats
  - Works in browser and Node.js

## Supported File Types

- **PNG** (`.png`)
- **JPEG** (`.jpg`, `.jpeg`)
- **Future**: Could add support for other formats

## How It Works

### 1. **OCR Text Extraction**
```typescript
const { data: { text } } = await Tesseract.recognize(buffer, 'eng+rus', {
  logger: m => console.log(m) // Optional: for debugging
});
```

### 2. **Table Data Extraction**
- Looks for structured table data in the extracted text
- Detects header rows with keywords (ID, TYPE, W, H, L, QTY, WEIGHT)
- Maps columns using flexible language support
- Parses data rows into DuctItem objects

### 3. **Pattern-Based Extraction**
If no table is found, extracts dimensions from unstructured text:
- **Rectangular**: `500x300x1000`, `500*300*1000`, `500×300×1000`
- **Round**: `Ø200x1000`, `D200x1000`, `диаметр 200 длина 1000`
- **With units**: `500x300x1000мм`, `Ø200x1000мм`

## Supported Languages

### **English**
- Headers: `ID`, `TYPE`, `W`, `H`, `L`, `QTY`, `WEIGHT`
- Types: `rect`, `round`
- Patterns: `500x300x1000`, `Ø200x1000`

### **Russian**
- Headers: `Код`, `Тип`, `Ширина`, `Высота`, `Длина`, `Количество`, `Вес`
- Types: `rect`, `round`, `круг`
- Patterns: `500x300x1000мм`, `диаметр 200 длина 1000`

## OCR Artifact Handling

The parser includes robust handling of common OCR errors:

### **Number Cleaning**
```typescript
const cleaned = value.toString()
  .replace(/[^\d.,]/g, '') // Remove non-numeric characters
  .replace(',', '.'); // Replace comma with dot
```

### **Text Normalization**
- Converts to lowercase for matching
- Trims whitespace
- Handles multiple delimiters (tab, space, semicolon, comma, pipe)

## Usage Examples

### **Table Format**
```
ID    TYPE    W     H     L      QTY   WEIGHT
R1    rect    500   300   1000   2     12.3
R2    rect    400   200   800    1     8.1
C1    round   200   0     1000   3     5.5
```

### **Unstructured Text**
```
Ventilation duct specifications:
Rectangular duct 500x300x1000mm
Round duct Ø200x1000mm
Another rectangular 400x200x800mm
```

### **Russian Text**
```
Спецификация воздуховодов:
Прямоугольный воздуховод 500x300x1000мм
Круглый воздуховод Ø200x1000мм
Диаметр 150 длина 800
```

## Performance Considerations

### **OCR Processing Time**
- **Small images** (< 1MB): 2-5 seconds
- **Medium images** (1-5MB): 5-15 seconds
- **Large images** (> 5MB): 15-30 seconds

### **Accuracy Factors**
- **Image quality**: Higher resolution = better accuracy
- **Text clarity**: Clear, readable text works best
- **Font size**: Larger fonts are easier to recognize
- **Contrast**: High contrast between text and background

## Error Handling

### **Common Issues**
1. **Poor image quality**: Blurry or low-resolution images
2. **Complex layouts**: Tables with merged cells or unusual formatting
3. **Handwritten text**: OCR works best with printed text
4. **Mixed languages**: Text in unsupported languages

### **Fallback Strategies**
1. **Table extraction fails** → Try pattern extraction
2. **No items found** → Return empty array with warning
3. **OCR fails** → Throw descriptive error message

## Testing

### **Unit Tests**
- Text extraction logic
- Pattern recognition
- Number parsing
- Header detection
- Table row splitting

### **Integration Tests**
- Full OCR pipeline with real images
- Error handling scenarios
- Performance testing

## Future Improvements

### **Enhanced OCR**
- **Additional languages**: German, French, Spanish
- **Better accuracy**: Fine-tune Tesseract parameters
- **Preprocessing**: Image enhancement before OCR

### **Advanced Features**
- **Table detection**: Better table structure recognition
- **Handwriting support**: Specialized OCR for handwritten text
- **Batch processing**: Process multiple images at once

### **Performance Optimization**
- **Caching**: Cache OCR results for repeated images
- **Parallel processing**: Process multiple images simultaneously
- **Image compression**: Optimize images before OCR

## Installation

The image parser is automatically included when you install the parsers package:

```bash
npm install @ventprom/parsers
```

## Dependencies

- `tesseract.js`: ^5.0.2 (OCR engine)
- `@ventprom/core`: Workspace dependency (data models)

## Browser Support

Tesseract.js works in modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Node.js Support

- Node.js 14+
- Works in server-side environments
- Supports file system operations

## Conclusion

The Image Parser significantly expands the Ventprom Packer's capabilities by allowing users to extract duct information from photos and scanned documents. While OCR accuracy depends on image quality, the parser includes robust error handling and fallback strategies to maximize success rates.

The combination of table extraction and pattern recognition ensures that most well-formatted documents can be processed successfully, making the system more accessible to users who work with physical documents or photos.


