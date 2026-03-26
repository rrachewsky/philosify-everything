/**
 * Download the final batch of missing Objectivist philosopher portraits
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

// Direct image URLs for missing philosophers
const PORTRAITS = {
  // ARI website portraits
  peter_schwartz: 'https://ari.aynrand.org/wp-content/uploads/2019/08/Schwartz_Peter260x260BW.jpg',
  robert_mayhew: 'https://ari.aynrand.org/wp-content/uploads/2019/08/Mayhew_Robert260x260GS.jpg',
  
  // Others that need to be found - using placeholder searches
  // andrew_bernstein: author of "The Capitalist Manifesto"
  // craig_biddle: The Objective Standard editor
  // darryl_wright: philosopher 
  // don_watkins: author, ARI
  // gregory_salmieri: co-editor of "A Companion to Ayn Rand"
  // michael_berliner: former ARI executive
  // robert_tracinski: writer, The Tracinski Letter
};

async function downloadAndProcess(id, url) {
  const outputPath = path.join(PORTRAITS_DIR, `${id}.jpg`);
  
  // Skip if already exists
  if (fs.existsSync(outputPath)) {
    console.log(`[SKIP] ${id} already exists`);
    return true;
  }
  
  console.log(`[DOWNLOAD] ${id} from ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`[FAIL] ${id}: HTTP ${response.status}`);
      return false;
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Process with Sharp: resize to 150x200 and apply sepia tone
    await sharp(buffer)
      .resize(150, 200, { fit: 'cover', position: 'top' })
      .recomb(SEPIA_MATRIX)
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    
    console.log(`[OK] ${id}`);
    return true;
  } catch (error) {
    console.log(`[ERROR] ${id}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Downloading final batch of philosopher portraits...\n');
  
  const results = { success: 0, failed: 0 };
  
  for (const [id, url] of Object.entries(PORTRAITS)) {
    const success = await downloadAndProcess(id, url);
    if (success) results.success++;
    else results.failed++;
    
    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\nDone: ${results.success} success, ${results.failed} failed`);
}

main().catch(console.error);
