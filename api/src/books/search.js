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

// Google Books search handler
export async function handleGoogleBooksSearch(query, env) {
  const { title, author } = parseQuery(query);

  console.log(`[BookSearch] Query: "${query}" -> Title: "${title}", Author: "${author}"`);

  const apiKey = await getSecret(env.GOOGLE_BOOKS_API_KEY);
  if (!apiKey) {
    throw new Error('Google Books API not configured');
  }

  // Build search query
  let searchQuery;
  if (title && author) {
    searchQuery = `intitle:${title}+inauthor:${author}`;
  } else if (author && !title) {
    searchQuery = `inauthor:${author}`;
  } else {
    searchQuery = title;
  }

  const searchUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=40&key=${apiKey}`;

  const searchRes = await fetch(searchUrl);

  if (!searchRes.ok) {
    throw new Error(`Google Books search failed: ${searchRes.status}`);
  }

  const data = await searchRes.json();
  const volumes = data.items || [];

  // Format options for frontend
  const options = volumes.map(volume => {
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

  // Filter to match user's actual query
  const searchLower = (title || query).toLowerCase();
  const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);

  const filteredOptions = uniqueOptions.filter(book => {
    const titleLower = book.title.toLowerCase();
    const authorLower = book.author.toLowerCase();
    const combined = `${titleLower} ${authorLower}`;

    return searchWords.every(word => combined.includes(word));
  });

  // Smart sorting: exact title matches first
  filteredOptions.sort((a, b) => {
    const aExact = a.title.toLowerCase() === searchLower;
    const bExact = b.title.toLowerCase() === searchLower;

    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    return 0;
  });

  console.log(`[BookSearch] Found ${filteredOptions.length} filtered books (${uniqueOptions.length} unique, ${options.length} total)`);

  const topResults = filteredOptions.slice(0, 40);

  return {
    query,
    parsed: { title, author },
    options: topResults,
    count: topResults.length
  };
}
