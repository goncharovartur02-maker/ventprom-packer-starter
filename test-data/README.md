# Test Data

This folder contains test data files for the Ventprom Packer project.

## Files

- `test-data.csv` - CSV file with sample duct items for testing

## Usage

This test data can be used to:

1. Test the CSV parser functionality
2. Verify duct item extraction
3. Test the 3D packing algorithm
4. Validate the complete workflow

## Data Format

The CSV file contains duct items with the following structure:
- ID, TYPE, W, H, L, QTY, WEIGHT
- Rectangular items: rect with width×height×length
- Round items: round with diameter (height=0)

## Example

```
ID,TYPE,W,H,L,QTY,WEIGHT
R1,rect,500,300,1000,2,12.3
R2,rect,400,200,800,1,8.1
C1,round,200,0,1000,3,5.5
```

## Note

This data is used by the unit tests and can be used for manual testing of the application.




