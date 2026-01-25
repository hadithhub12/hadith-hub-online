/**
 * Setup script to decompress the database file if needed
 * Run this before starting the app if database doesn't exist
 *
 * In production (Vercel), this is skipped when TURSO_DATABASE_URL is set
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Skip database setup if using Turso (production)
if (process.env.TURSO_DATABASE_URL) {
  console.log('Using Turso database - skipping local database setup');
  process.exit(0);
}

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const DB_PATH = path.join(DATA_DIR, 'hadith.db');
const GZ_PATH = path.join(DATA_DIR, 'hadith.db.gz');

async function setupDatabase() {
  // Check if uncompressed database exists
  if (fs.existsSync(DB_PATH)) {
    const stats = fs.statSync(DB_PATH);
    console.log(`Database exists: ${DB_PATH}`);
    console.log(`Size: ${(stats.size / 1024 / 1024 / 1024).toFixed(2)} GB`);
    return;
  }

  // Check if compressed database exists
  if (!fs.existsSync(GZ_PATH)) {
    console.log('No local database found - assuming Turso will be used');
    console.log('Set TURSO_DATABASE_URL environment variable for production');
    // Don't fail - allow build to continue for Turso deployments
    return;
  }

  console.log('Decompressing database...');
  console.log(`Source: ${GZ_PATH}`);
  console.log(`Target: ${DB_PATH}`);

  const startTime = Date.now();

  // Decompress using streams for memory efficiency
  await new Promise((resolve, reject) => {
    const input = fs.createReadStream(GZ_PATH);
    const output = fs.createWriteStream(DB_PATH);
    const gunzip = zlib.createGunzip();

    input.pipe(gunzip).pipe(output);

    output.on('finish', resolve);
    output.on('error', reject);
    gunzip.on('error', reject);
    input.on('error', reject);
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const stats = fs.statSync(DB_PATH);
  console.log(`Done in ${elapsed}s`);
  console.log(`Database size: ${(stats.size / 1024 / 1024 / 1024).toFixed(2)} GB`);
}

setupDatabase().catch(err => {
  console.error('Error setting up database:', err);
  process.exit(1);
});
