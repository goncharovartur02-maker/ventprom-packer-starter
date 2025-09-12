# Universal Parser for Ventprom Packer

## Overview

The Universal Parser is designed to extract **ALL** data from files, not just air duct cross-sections. It can handle multiple different cross-sections, various lengths (1160, 1250, etc.), and any type of dimensional data.

## Key Features

### 🌍 **Universal Data Extraction**
- **All dimensions**: width, height, depth, length, diameter, thickness, radius
- **Multiple cross-sections**: Different shapes and sizes in one file
- **Various lengths**: 1160, 1250, 2000, 3000, etc.
- **Any item type**: Not limited to air ducts

### 📊 **Comprehensive Column Mapping**
- **Basic identifiers**: ID, name, type, category
- **Dimensions**: width, height, depth, length, diameter, thickness, radius
- **Properties**: quantity, weight, material, color, finish
- **Additional**: notes, supplier, price

### 🌐 **Multi-language Support**
- **English**: width, height, length, diameter
- **Russian**: ширина, высота, длина, диаметр
- **German**: breite, höhe, länge, durchmesser
- **French**: largeur, hauteur, longueur, diamètre

## Data Model

### **UniversalItem Interface**
```typescript
interface UniversalItem {
  id: string;
  name?: string;
  type?: string;
  category?: string;
  dimensions: {
    width?: number;
    height?: number;
    depth?: number;
    length?: number;
    diameter?: number;
    thickness?: number;
    radius?: number;
    [key: string]: number | undefined; // Any dimension
  };
  qty: number;
  weightKg?: number;
  material?: string;
  notes?: string;
  [key: string]: any; // Any additional property
}
```

## Supported File Types

### **Excel Files (.xlsx)**
- **Multiple worksheets**: Processes all sheets
- **Flexible headers**: Finds header rows automatically
- **All data types**: Numbers, text, formulas
- **Complex layouts**: Handles merged cells, formatting

### **PDF Files (.pdf)**
- **Text extraction**: Uses pdf-parse library
- **Table detection**: Finds structured data
- **Pattern recognition**: Extracts dimensions from text
- **Multi-page**: Processes all pages

### **Text Files (.txt, .csv)**
- **Auto-delimiter detection**: Semicolon, comma, tab, pipe
- **Flexible format**: Any delimited format
- **Encoding support**: UTF-8, Windows-1251, etc.

### **Image Files (.png, .jpg, .jpeg)**
- **OCR extraction**: Uses Tesseract.js
- **Multi-language**: English + Russian
- **Pattern recognition**: Finds dimensions in images
- **Table detection**: Recognizes table structures

## Usage Examples

### **Multiple Cross-Sections**
```
ID    | TYPE      | WIDTH | HEIGHT | LENGTH | QTY | MATERIAL
R1    | rectangular| 500   | 300    | 1160   | 2   | steel
R2    | rectangular| 400   | 200    | 1250   | 1   | aluminum
C1    | round     | 200   | 0      | 2000   | 3   | steel
C2    | round     | 150   | 0      | 3000   | 1   | plastic
```

### **Various Lengths**
```
ID    | LENGTH | QTY | NOTES
D1    | 1160   | 5   | Short duct
D2    | 1250   | 3   | Medium duct
D3    | 2000   | 2   | Long duct
D4    | 3000   | 1   | Extra long duct
```

### **Complex Dimensions**
```
ID    | WIDTH | HEIGHT | DEPTH | THICKNESS | MATERIAL
P1    | 500   | 300    | 100   | 2         | steel
P2    | 400   | 200    | 80    | 1.5       | aluminum
P3    | 600   | 400    | 120   | 3         | stainless
```

## Column Mapping Examples

### **English Headers**
- ID, NAME, TYPE, WIDTH, HEIGHT, LENGTH, DIAMETER, QTY, WEIGHT, MATERIAL

### **Russian Headers**
- Код, Название, Тип, Ширина, Высота, Длина, Диаметр, Количество, Вес, Материал

### **Mixed Headers**
- ID, Ширина, Height, Длина, QTY, Материал

## Pattern Recognition

### **Dimension Patterns**
- **Rectangular**: `500x300x1000`, `500*300*1000`, `500×300×1000`
- **Round**: `Ø200x1000`, `D200x1000`, `диаметр 200 длина 1000`
- **With units**: `500x300x1000мм`, `Ø200x1000мм`
- **Flexible**: `500 x 300 x 1000`, `500 * 300 * 1000`

### **Text Patterns**
- **Specifications**: "Rectangular duct 500x300x1000mm"
- **Lists**: "Items: 500x300x1000, 400x200x800, Ø200x1000"
- **Tables**: Structured data with headers

## Error Handling

### **Robust Parsing**
- **Missing data**: Skips invalid rows, continues processing
- **Format variations**: Handles different number formats
- **Encoding issues**: Supports various text encodings
- **Large files**: Processes files of any size

### **Validation**
- **Dimension validation**: Ensures positive values
- **Data integrity**: Checks for required fields
- **Type conversion**: Handles string to number conversion
- **Error reporting**: Detailed error messages

## Performance

### **Optimization**
- **Streaming**: Processes large files efficiently
- **Memory management**: Handles files of any size
- **Parallel processing**: Multiple files simultaneously
- **Caching**: Reuses parsed data when possible

### **Scalability**
- **Large datasets**: Handles thousands of items
- **Multiple files**: Processes multiple files at once
- **Real-time**: Fast processing for interactive use
- **Batch processing**: Efficient for bulk operations

## Integration

### **Backward Compatibility**
- **Legacy support**: Works with existing DuctItem interface
- **Gradual migration**: Can use both old and new parsers
- **API compatibility**: Same interface, enhanced functionality

### **Future Extensibility**
- **Plugin system**: Easy to add new file types
- **Custom parsers**: Support for specialized formats
- **API extensions**: Easy to add new features

## Testing

### **Comprehensive Coverage**
- **Unit tests**: Individual parser components
- **Integration tests**: Full parsing pipeline
- **Performance tests**: Large file handling
- **Error tests**: Malformed data handling

### **Real-world Testing**
- **Sample files**: Test with actual user files
- **Edge cases**: Unusual formats and data
- **Stress testing**: Large files and datasets
- **User feedback**: Continuous improvement

## Conclusion

The Universal Parser transforms the Ventprom Packer from a specialized air duct tool into a **universal data extraction system**. It can handle:

- ✅ **Multiple cross-sections** in one file
- ✅ **Various lengths** (1160, 1250, 2000, 3000, etc.)
- ✅ **Any dimensional data** (not just air ducts)
- ✅ **All file types** (Excel, PDF, text, images)
- ✅ **Multiple languages** (English, Russian, German, French)
- ✅ **Complex layouts** (tables, unstructured text, images)

This makes the system truly universal and capable of processing any type of dimensional data, not just air duct specifications.




