# Ventprom Packer - Universal Parser

A universal file parser and 3D packing application for air ducts and other items.

## Features

- **Universal Parser**: Extracts data from XLSX, PDF, TXT, CSV, PNG, JPG files
- **3D Packing**: Optimizes placement of items in vehicles
- **Multiple Formats**: Supports various cross-sections and dimensions
- **Web Interface**: Easy-to-use React frontend
- **API**: RESTful API with NestJS

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/ventprom-packer.git
cd ventprom-packer

# Run with Docker
docker-compose up --build
```

### Option 2: Node.js

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start the application
npm run dev
```

## Access

- **Web Interface**: http://localhost:3000
- **API**: http://localhost:3001

## Supported File Types

- **Excel**: .xlsx files with air duct data
- **PDF**: .pdf files with text data
- **Text**: .txt, .csv files
- **Images**: .png, .jpg, .jpeg files (OCR)

## Universal Parser

The universal parser can extract:
- Item dimensions (width, height, depth, length, diameter)
- Quantities and materials
- Various cross-sections (rectangular, round)
- Multiple languages (English, Russian, German, French)

## Example Files

Upload your files to test the parser:
- `example xlsx.xlsx` - Excel with air duct data
- `example pdf.pdf` - PDF with text data
- `example png.png` - Image with dimensions

## Development

```bash
# Install dependencies
npm install

# Build packages
npm run build

# Run tests
npm test

# Start development
npm run dev
```

## Docker Commands

```bash
# Build and start
docker-compose up --build

# Stop containers
docker-compose down

# Clean up
docker system prune -f
```

## License

MIT License