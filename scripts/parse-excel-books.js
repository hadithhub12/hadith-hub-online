/**
 * Parse the book list Excel file and create a JSON mapping file
 * Then update the database with correct Arabic/Persian and English titles
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const excelPath = 'C:\\Users\\syedf\\OneDrive\\Desktop\\List_of_books.xlsx';
const outputPath = path.join(__dirname, 'book-names-mapping.json');

try {
  // Read Excel file
  const workbook = XLSX.readFile(excelPath);

  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Get header row
  const header = data[0];
  console.log('Header:', header);

  const books = [];

  // Parse each data row (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 5) continue;

    const book = {
      index: String(row[0]).trim(),
      titleAr: String(row[1] || '').trim(),
      titleEn: String(row[2] || '').trim(),
      authorAr: String(row[3] || '').trim(),
      authorEn: String(row[4] || '').trim()
    };

    // Skip empty rows
    if (!book.index || book.index === 'undefined') continue;

    books.push(book);

    // Log first few for verification
    if (i <= 5) {
      console.log(`Book ${i}:`, book);
    }
  }

  console.log(`\nTotal books parsed: ${books.length}`);

  // Write to JSON file
  fs.writeFileSync(outputPath, JSON.stringify(books, null, 2), 'utf8');
  console.log(`Output written to: ${outputPath}`);

} catch (e) {
  console.error('Error:', e.message);
  console.error(e.stack);
}
