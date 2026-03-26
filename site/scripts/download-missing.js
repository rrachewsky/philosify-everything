/**
 * Download missing philosopher portraits from Wikimedia Commons
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORTRAITS_DIR = path.join(__dirname, '..', 'public', 'portraits');

// Sepia tone matrix
const SEPIA_MATRIX = [
  0.393, 0.769, 0.189,
  0.349, 0.686, 0.168,
  0.272, 0.534, 0.131,
];

// Missing philosophers with search terms and known Wikimedia Commons files
const MISSING = {
  al_ghazali: 'Al-Ghazali',
  auberon_herbert: 'Auberon Herbert',
  austin: 'J. L. Austin philosopher',
  barbara_branden: 'Barbara Branden',
  bernard_williams: 'Bernard Williams philosopher',
  buddha: 'Gautama Buddha statue',
  david_kelley: 'David Kelley philosopher',
  gilles_deleuze: 'Gilles Deleuze',
  gorgias: 'Gorgias philosopher',
  hypatia: 'Hypatia Alexandria',
  isabel_paterson: 'Isabel Paterson',
  lord_acton: 'Lord Acton',
  louis_althusser: 'Louis Althusser',
  onkar_ghate: 'Onkar Ghate',
  porphyry: 'Porphyry philosopher',
  thomas_kuhn: 'Thomas Kuhn',
};

// Direct Wikimedia Commons URLs for known images
const DIRECT_URLS = {
  al_ghazali: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Al-Ghazali.png',
  buddha: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Seated_Buddha_Amitabha_statue%2C_Borobodur.jpg',
  gilles_deleuze: 'https://upload.wikimedia.org/wikipedia/en/2/21/Gilles_Deleuze.jpg',
  gorgias: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Gorgias_Allegory_cropped.jpg',
  hypatia: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Hypatia_%28Charles_William_Mitchell%29.jpg',
  lord_acton: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Lord_Acton.jpg',
  louis_althusser: 'https://upload.wikimedia.org/wikipedia/en/1/1e/Louis_Althusser.jpg',
  porphyry: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Porphyry.jpg',
  thomas_kuhn: 'https://upload.wikimedia.org/wikipedia/en/5/52/Thomas_Kuhn.jpg',
};

async function searchWikimediaCommons(searchTerm) {
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&format=json&srlimit=5`;
  
  try {
    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'PhilosifyBot/1.0' },
    });
    const data = await response.json();
    
    if (data.query?.search?.length > 0) {
      // Get the first image result
      const title = data.query.search[0].title;
      
      // Get image URL
      const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&iiurlwidth=300&format=json`;
      const imageResponse = await fetch(imageInfoUrl, {
        headers: { 'User-Agent': 'PhilosifyBot/1.0' },
      });
      const imageData = await imageResponse.json();
      
      const pages = imageData.query?.pages;
      if (pages) {
        const page = Object.values(pages)[0];
        return page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url;
      }
    }
  } catch (e) {
    console.log(`  Search failed: ${e.message}`);
  }
  return null;
}

async function downloadImage(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'PhilosifyBot/1.0' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function processImage(inputBuffer) {
  return sharp(inputBuffer)
    .resize(150, 200, { fit: 'cover', position: 'top' })
    .recomb([
      [SEPIA_MATRIX[0], SEPIA_MATRIX[1], SEPIA_MATRIX[2]],
      [SEPIA_MATRIX[3], SEPIA_MATRIX[4], SEPIA_MATRIX[5]],
      [SEPIA_MATRIX[6], SEPIA_MATRIX[7], SEPIA_MATRIX[8]],
    ])
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

async function main() {
  console.log('Downloading missing portraits...\n');
  
  for (const [id, searchTerm] of Object.entries(MISSING)) {
    const outputPath = path.join(PORTRAITS_DIR, `${id}.jpg`);
    
    if (fs.existsSync(outputPath)) {
      console.log(`[SKIP] ${id} (exists)`);
      continue;
    }
    
    console.log(`[${id}] Searching...`);
    
    // Try direct URL first
    let imageUrl = DIRECT_URLS[id];
    
    // If no direct URL, search Commons
    if (!imageUrl) {
      imageUrl = await searchWikimediaCommons(searchTerm);
    }
    
    if (!imageUrl) {
      console.log(`  ✗ No image found`);
      continue;
    }
    
    try {
      console.log(`  Downloading from: ${imageUrl.substring(0, 60)}...`);
      const buffer = await downloadImage(imageUrl);
      const processed = await processImage(buffer);
      fs.writeFileSync(outputPath, processed);
      console.log(`  ✓ Saved`);
    } catch (e) {
      console.log(`  ✗ Failed: ${e.message}`);
    }
    
    // Delay to be nice
    await new Promise(r => setTimeout(r, 1500));
  }
  
  console.log('\nDone!');
}

main().catch(console.error);
