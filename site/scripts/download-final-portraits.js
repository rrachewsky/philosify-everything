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
  // Final 7 Objectivists - URLs provided by user
  andrew_bernstein: 'https://andrewbernstein.net/wp-content/uploads/2011/09/ab_big.jpg',
  craig_biddle: 'https://freemarket-rs.com/wp-content/uploads/2024/11/Biddle-Craig.jpg',
  robert_tracinski: 'https://cdn.prod.website-files.com/5e94942247047e79b85db6b3/66181e815c73f288dbfaca54_654bd97a76bc6cb5bd9588a9_rob-2023-sq.webp',
  don_watkins: 'https://pbs.twimg.com/profile_images/1714791249897553920/njZ1YBZw_400x400.jpg',
  gregory_salmieri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRK6LeVkKT3gp29P0XpoO4KKhjwPViJVuNadQ&s',
  darryl_wright: 'https://www.hmc.edu/hsa/wp-content/uploads/sites/25/2022/09/faculty-wright.jpg',
  michael_berliner: 'https://prabook.com/web/show-photo.jpg?id=1527152',
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
