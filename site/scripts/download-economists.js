/**
 * Download economist portraits
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORTRAITS_DIR = path.join(__dirname, '..', 'public', 'portraits');

// Sepia tone matrix (3x3 format for Sharp)
const SEPIA_MATRIX = [
  [0.393, 0.769, 0.189],
  [0.349, 0.686, 0.168],
  [0.272, 0.534, 0.131],
];

// Portrait sources - try prabook and other sources
const PORTRAITS = {
  carl_menger: 'https://prabook.com/web/show-photo.jpg?id=2587385',
  eugen_bohm_bawerk: 'https://prabook.com/web/show-photo.jpg?id=2054704',
  george_stigler: 'https://prabook.com/web/show-photo.jpg?id=1912637',
};

async function downloadAndProcess(id, url) {
  const outputPath = path.join(PORTRAITS_DIR, `${id}.jpg`);
  
  console.log(`[DOWNLOAD] ${id} from ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`[FAIL] ${id}: HTTP ${response.status}`);
      return false;
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Process with Sharp: resize to 150x200, apply sepia
    await sharp(buffer)
      .resize(150, 200, { fit: 'cover', position: 'top' })
      .recomb(SEPIA_MATRIX)
      .modulate({ brightness: 1.05, saturation: 0.9 })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    
    console.log(`[SUCCESS] ${id} saved to ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`[FAIL] ${id}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Downloading economist portraits...\n');
  
  for (const [id, url] of Object.entries(PORTRAITS)) {
    await downloadAndProcess(id, url);
    // Small delay to be respectful
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\nDone!');
}

main();
