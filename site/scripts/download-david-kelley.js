/**
 * Download correct David Kelley portrait
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

const url = 'https://m.media-amazon.com/images/I/81e+NfT95YL.jpg';

async function main() {
  const outputPath = path.join(PORTRAITS_DIR, 'david_kelley.jpg');
  
  console.log(`[DOWNLOAD] david_kelley from ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`[FAIL] HTTP ${response.status}`);
      return;
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Process with Sharp: resize to 150x200, apply sepia
    await sharp(buffer)
      .resize(150, 200, { fit: 'cover', position: 'top' })
      .recomb(SEPIA_MATRIX)
      .modulate({ brightness: 1.05, saturation: 0.9 })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    
    console.log(`[SUCCESS] david_kelley saved to ${outputPath}`);
  } catch (error) {
    console.error(`[FAIL] ${error.message}`);
  }
}

main();
