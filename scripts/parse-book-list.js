/**
 * Parse the book list CSV and create a JSON mapping file
 * The CSV contains proper Arabic/Persian titles and English titles with authors
 */

const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

// Read the CSV file with UTF-16LE encoding
const csvPath = 'C:\\Users\\syedf\\OneDrive\\Desktop\\List_of_books.csv';
const outputPath = path.join(__dirname, 'book-names-mapping.json');

try {
  // Read file as buffer
  const buffer = fs.readFileSync(csvPath);

  // Try UTF-16LE decoding (common for Excel CSVs)
  let content = iconv.decode(buffer, 'UTF-16LE');

  // If it starts with BOM, remove it
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  // Parse CSV
  const lines = content.split(/\r?\n/).filter(line => line.trim());

  // Get header row
  const header = lines[0];
  console.log('Header:', header);

  const books = [];

  // Parse each data row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Parse CSV with proper quote handling
    const values = parseCSVLine(line);

    if (values.length >= 5) {
      const book = {
        index: values[0],
        titleAr: values[1],
        titleEn: values[2],
        authorAr: values[3],
        authorEn: values[4]
      };
      books.push(book);

      // Log first few for verification
      if (i <= 5) {
        console.log(`Book ${i}:`, book);
      }
    }
  }

  console.log(`\nTotal books parsed: ${books.length}`);

  // Write to JSON file
  fs.writeFileSync(outputPath, JSON.stringify(books, null, 2), 'utf8');
  console.log(`Output written to: ${outputPath}`);

} catch (e) {
  console.error('Error:', e.message);
}

// CSV parser that handles quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}
