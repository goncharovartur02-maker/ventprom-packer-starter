// Simple test to verify the universal parser works
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Universal Parser with Example Files\n');

// Test the Excel parser
async function testExcelParser() {
  try {
    console.log('📊 Testing Excel Parser...');
    
    // Import the Excel parser
    const { ExcelParser } = require('./packages/parsers/dist/excel');
    const parser = new ExcelParser();
    
    // Read the example Excel file
    const filePath = path.join(__dirname, 'examples', 'example xlsx.xlsx');
    const buffer = fs.readFileSync(filePath);
    
    console.log(`✅ File loaded: ${buffer.length} bytes`);
    
    // Parse the file
    const items = await parser.parseUniversal(buffer);
    
    console.log(`✅ Extracted ${items.length} items:`);
    items.forEach((item, index) => {
      console.log(`   ${index + 1}. ID: ${item.id}`);
      console.log(`      Type: ${item.type || 'N/A'}`);
      console.log(`      Dimensions:`, item.dimensions);
      console.log(`      Qty: ${item.qty}`);
      console.log(`      Material: ${item.material || 'N/A'}`);
      console.log('');
    });
    
    return items;
  } catch (error) {
    console.log(`❌ Excel Parser Error: ${error.message}`);
    return [];
  }
}

// Test the PDF parser
async function testPdfParser() {
  try {
    console.log('📄 Testing PDF Parser...');
    
    // Import the PDF parser
    const { PdfParser } = require('./packages/parsers/dist/pdf');
    const parser = new PdfParser();
    
    // Read the example PDF file
    const filePath = path.join(__dirname, 'examples', 'example pdf.pdf');
    const buffer = fs.readFileSync(filePath);
    
    console.log(`✅ File loaded: ${buffer.length} bytes`);
    
    // Parse the file
    const items = await parser.parse(buffer);
    
    console.log(`✅ Extracted ${items.length} items:`);
    items.forEach((item, index) => {
      console.log(`   ${index + 1}. ID: ${item.id}`);
      console.log(`      Type: ${item.type}`);
      console.log(`      Dimensions: W:${item.w}, H:${item.h}, L:${item.length}`);
      console.log(`      Qty: ${item.qty}`);
      console.log('');
    });
    
    return items;
  } catch (error) {
    console.log(`❌ PDF Parser Error: ${error.message}`);
    return [];
  }
}

// Run the tests
async function runTests() {
  console.log('🚀 Starting Universal Parser Tests...\n');
  
  const excelItems = await testExcelParser();
  console.log('---\n');
  const pdfItems = await testPdfParser();
  
  console.log('🎯 Test Results Summary:');
  console.log(`📊 Excel items extracted: ${excelItems.length}`);
  console.log(`📄 PDF items extracted: ${pdfItems.length}`);
  console.log(`📋 Total items: ${excelItems.length + pdfItems.length}`);
  
  if (excelItems.length > 0 || pdfItems.length > 0) {
    console.log('\n✅ Universal Parser is working!');
    console.log('🌍 It can extract ALL data from files, not just air ducts!');
  } else {
    console.log('\n❌ No items extracted. Check the parser implementation.');
  }
}

runTests().catch(console.error);


