// ============================================================
// GOOGLE BOOKS - METADATA FETCHING
// ============================================================

import { getSecret } from '../utils/secrets.js';

// Get book metadata by Google Books ID (when already selected from dropdown)
export async function getBookMetadataById(googleBooksId, env) {
  try {
    const apiKey = await getSecret(env.GOOGLE_BOOKS_API_KEY);
    if (!apiKey) {
      console.warn('[GoogleBooks] API key not configured');
      return null;
    }

    const url = `https://www.googleapis.com/books/v1/volumes/${googleBooksId}?key=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Google Books volume fetch failed: ${res.status}`);
    }

    const volume = await res.json();
    const info = volume.volumeInfo || {};
    const identifiers = info.industryIdentifiers || [];
    const isbn13 = identifiers.find(id => id.type === 'ISBN_13')?.identifier;
    const isbn10 = identifiers.find(id => id.type === 'ISBN_10')?.identifier;

    return {
      google_books_id: volume.id,
      title: info.title || 'Unknown Title',
      author: (info.authors || []).join(', ') || 'Unknown Author',
      cover_url: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
      published_date: info.publishedDate || null,
      release_year: info.publishedDate ? info.publishedDate.substring(0, 4) : null,
      isbn: isbn13 || isbn10 || null,
      description: info.description || null,
      categories: info.categories || [],
      page_count: info.pageCount || null,
      publisher: info.publisher || null,
      language: info.language || null,
    };
  } catch (error) {
    console.error('[GoogleBooks] Error:', error);
    return null;
  }
}

// Get book metadata by search (fallback when no ID)
export async function getBookMetadata(title, author, env) {
  try {
    const apiKey = await getSecret(env.GOOGLE_BOOKS_API_KEY);
    if (!apiKey) {
      console.warn('[GoogleBooks] API key not configured');
      return null;
    }

    const query = author
      ? `intitle:${title}+inauthor:${author}`
      : title;

    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&key=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Google Books search failed: ${res.status}`);
    }

    const data = await res.json();
    const volumes = data.items || [];

    if (volumes.length === 0) {
      console.warn(`[GoogleBooks] No results found for "${title}" by "${author}"`);
      return null;
    }

    // Return first match
    const volume = volumes[0];
    const info = volume.volumeInfo || {};
    const identifiers = info.industryIdentifiers || [];
    const isbn13 = identifiers.find(id => id.type === 'ISBN_13')?.identifier;
    const isbn10 = identifiers.find(id => id.type === 'ISBN_10')?.identifier;

    return {
      google_books_id: volume.id,
      title: info.title || 'Unknown Title',
      author: (info.authors || []).join(', ') || 'Unknown Author',
      cover_url: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
      published_date: info.publishedDate || null,
      release_year: info.publishedDate ? info.publishedDate.substring(0, 4) : null,
      isbn: isbn13 || isbn10 || null,
      description: info.description || null,
      categories: info.categories || [],
      page_count: info.pageCount || null,
      publisher: info.publisher || null,
      language: info.language || null,
    };
  } catch (error) {
    console.error('[GoogleBooks] Error:', error);
    return null;
  }
}
