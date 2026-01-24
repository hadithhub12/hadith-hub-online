const XLSX = require('xlsx');
const workbook = XLSX.readFile('C:\\Users\\syedf\\OneDrive\\Desktop\\List_of_books.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Search for أعلام الدین
console.log('Searching for "أعلام الدین":');
for (let row = 2; row <= 750; row++) {
  const ar = sheet['B' + row]?.v || '';
  if (ar.includes('أعلام الدین') || ar.includes('اعلام الدين')) {
    const en = sheet['C' + row]?.v || '';
    console.log('  Row', row, '| Ar:', ar, '| En:', en);
  }
}

// Search for A'lam
console.log('\nSearching for English "A\'lam" or "Alam":');
for (let row = 2; row <= 750; row++) {
  const en = sheet['C' + row]?.v || '';
  if (en.toLowerCase().includes("a'lam") || en.toLowerCase().includes('alam al-din') || en.toLowerCase().includes('aalam')) {
    const ar = sheet['B' + row]?.v || '';
    console.log('  Row', row, '| Ar:', ar, '| En:', en);
  }
}
