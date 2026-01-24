const XLSX = require('xlsx');
const workbook = XLSX.readFile('C:\\Users\\syedf\\OneDrive\\Desktop\\List_of_books.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Get all unique English titles from Excel
const englishTitles = new Set();
for (let row = 2; row <= 750; row++) {
  const en = sheet['C' + row]?.v || '';
  if (en) englishTitles.add(en);
}

console.log('Unique English titles in Excel:', englishTitles.size);
console.log('\nAll English titles:');
[...englishTitles].sort().forEach(t => console.log(t));
