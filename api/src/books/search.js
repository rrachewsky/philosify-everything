// ============================================================
// GOOGLE BOOKS - SEARCH WITH INTELLIGENT PARSING
// ============================================================

import { getSecret } from '../utils/secrets.js';

// Parse search query - intelligent title/author detection
export function parseQuery(query) {
  query = query.trim();

  // Pattern 1: "Title - Author" (explicit separator)
  if (query.includes(' - ')) {
    const [title, author] = query.split(' - ').map(s => s.trim());
    return { title, author };
  }

  // Pattern 2: "Title by Author" (explicit keyword)
  if (query.toLowerCase().includes(' by ')) {
    const parts = query.split(/\s+by\s+/i);
    return { title: parts[0].trim(), author: parts[1]?.trim() || '' };
  }

  // Default: Search broadly
  return { title: query, author: '' };
}

// Fetch volumes from Google Books API for a given query string
async function fetchVolumes(searchQuery, apiKey) {
  const searchUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=40&key=${apiKey}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    throw new Error(`Google Books search failed: ${searchRes.status}`);
  }
  const data = await searchRes.json();
  return data.items || [];
}

// Convert raw Google Books volumes to our option format
function formatVolumes(volumes) {
  return volumes.map(volume => {
    const info = volume.volumeInfo || {};
    const identifiers = info.industryIdentifiers || [];
    const isbn13 = identifiers.find(id => id.type === 'ISBN_13')?.identifier;
    const isbn10 = identifiers.find(id => id.type === 'ISBN_10')?.identifier;

    return {
      google_books_id: volume.id,
      title: info.title || 'Unknown Title',
      author: (info.authors || []).join(', ') || 'Unknown Author',
      cover_url: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
      year: info.publishedDate ? info.publishedDate.substring(0, 4) : null,
      isbn: isbn13 || isbn10 || null,
      description: info.description ? info.description.substring(0, 300) : null,
      categories: info.categories || [],
      page_count: info.pageCount || null,
      publisher: info.publisher || null,
      language: info.language || null,
    };
  });
}

// Google Books search handler
export async function handleGoogleBooksSearch(query, env) {
  const { title, author } = parseQuery(query);

  console.log(`[BookSearch] Query: "${query}" -> Title: "${title}", Author: "${author}"`);

  const apiKey = await getSecret(env.GOOGLE_BOOKS_API_KEY);
  if (!apiKey) {
    throw new Error('Google Books API not configured');
  }

  let volumes = [];

  // Strategy 1: Operator-based search (intitle/inauthor with SPACE separator)
  if (title && author) {
    const operatorQuery = `intitle:${title} inauthor:${author}`;
    console.log(`[BookSearch] Strategy 1 (operators): "${operatorQuery}"`);
    volumes = await fetchVolumes(operatorQuery, apiKey);
  } else if (author && !title) {
    const operatorQuery = `inauthor:${author}`;
    console.log(`[BookSearch] Strategy 1 (author only): "${operatorQuery}"`);
    volumes = await fetchVolumes(operatorQuery, apiKey);
  }

  // Strategy 2: Fallback to plain text search if operators returned nothing
  if (volumes.length === 0) {
    const plainQuery = title && author ? `${title} ${author}` : title || author || query;
    console.log(`[BookSearch] Strategy 2 (plain text fallback): "${plainQuery}"`);
    volumes = await fetchVolumes(plainQuery, apiKey);
  }

  // Format options for frontend
  const options = formatVolumes(volumes);

  // Deduplicate: Remove duplicate title+author combinations
  const seen = new Set();
  const uniqueOptions = options.filter(book => {
    const key = `${book.title.toLowerCase()}|${book.author.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  // Smart sorting: exact title matches first, then partial matches
  const searchLower = (title || query).toLowerCase();
  uniqueOptions.sort((a, b) => {
    const aExact = a.title.toLowerCase() === searchLower;
    const bExact = b.title.toLowerCase() === searchLower;

    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // Then prefer titles that start with the search term
    const aStarts = a.title.toLowerCase().startsWith(searchLower);
    const bStarts = b.title.toLowerCase().startsWith(searchLower);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    return 0;
  });

  // No aggressive filtering — Google Books already handles relevance.
  // Return all unique results (Google API returns max 40).
  console.log(`[BookSearch] Found ${uniqueOptions.length} unique books (${options.length} total from API)`);

  return {
    query,
    parsed: { title, author },
    options: uniqueOptions,
    count: uniqueOptions.length
  };
}
