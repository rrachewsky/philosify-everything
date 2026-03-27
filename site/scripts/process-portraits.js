/**
 * Process portrait images: resize to 150x200 and apply sepia tone
 * Run: node scripts/process-portraits.js
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

// Files to process (modified + new)
const FILES_TO_PROCESS = [
  'a_j_ayer.jpg',
  'allan_gotthelf.jpg',
  'anselm.jpg',
  'auberon_herbert.jpg',
  'austin.jpg',
  'averroes.jpg',
  'barbara_branden.jpg',
  'ben_bayer.jpg',
  'boethius.jpg',
  'buddha.jpg',
  'isabel_paterson.jpg',
  'karl_marx.jpg',
  'laozi.jpg',
  'maimonides.jpg',
  'max_stirner.jpg',
  'peter_railton.jpg',
  'proclus.jpg',
  'protagoras.jpg',
  'pythagoras.jpg',
  'robert_nozick.jpg',
  'sextus_empiricus.jpg',
  'stephen_hicks.jpg',
  'wilhelm_von_humboldt.jpg',
];

// Special files that need renaming
const RENAME_FILES = {
  'Böhm_Bawerk.jpg': 'eugen_bohm_bawerk.jpg',
  '_tmp_eugen_bohm_bawerk.png': null, // delete
  '_tmp_george_stigler.jpg': null, // delete
};

async function processImage(filename) {
  const inputPath = path.join(PORTRAITS_DIR, filename);
  const outputPath = path.join(PORTRAITS_DIR, filename.replace(/\.\w+$/, '.jpg'));
  
  if (!fs.existsSync(inputPath)) {
    console.log(`[SKIP] ${filename} - not found`);
    return false;
  }
  
  try {
    const buffer = fs.readFileSync(inputPath);
    
    // Process with Sharp: resize to 150x200, apply sepia
    await sharp(buffer)
      .resize(150, 200, { fit: 'cover', position: 'top' })
      .recomb(SEPIA_MATRIX)
      .modulate({ brightness: 1.05, saturation: 0.9 })
      .jpeg({ quality: 85 })
      .toFile(outputPath + '.tmp');
    
    // Replace original with processed
    fs.renameSync(outputPath + '.tmp', outputPath);
    
    console.log(`[OK] ${filename} -> 150x200 sepia`);
    return true;
  } catch (error) {
    console.error(`[FAIL] ${filename}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('=== Processing Portrait Images ===\n');
  console.log(`Directory: ${PORTRAITS_DIR}\n`);
  
  let processed = 0;
  let failed = 0;
  
  // Handle special renames first
  for (const [oldName, newName] of Object.entries(RENAME_FILES)) {
    const oldPath = path.join(PORTRAITS_DIR, oldName);
    if (fs.existsSync(oldPath)) {
      if (newName) {
        // Rename and add to process list
        const newPath = path.join(PORTRAITS_DIR, newName);
        fs.renameSync(oldPath, newPath);
        console.log(`[RENAME] ${oldName} -> ${newName}`);
        FILES_TO_PROCESS.push(newName);
      } else {
        // Delete temp file
        fs.unlinkSync(oldPath);
        console.log(`[DELETE] ${oldName}`);
      }
    }
  }
  
  console.log('');
  
  // Process all files
  for (const filename of FILES_TO_PROCESS) {
    const success = await processImage(filename);
    if (success) processed++;
    else failed++;
  }
  
  console.log(`\n=== Done: ${processed} processed, ${failed} failed ===`);
}

main().catch(console.error);
