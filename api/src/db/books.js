// ============================================================
// DATABASE - BOOK MANAGEMENT
// ============================================================

import { getSecret } from '../utils/secrets.js';

// Get or create book in database
export async function getOrCreateBook(env, title, author, googleBooksId = null, isbn = null, metadata = {}) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

  // Check if book exists by google_books_id (unique identifier)
  if (googleBooksId) {
    const searchUrl = `${supabaseUrl}/rest/v1/books?google_books_id=eq.${encodeURIComponent(googleBooksId)}&select=id`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    const existing = await searchRes.json();
    if (existing && existing.length > 0) {
      return existing[0].id;
    }
  } else if (title && author) {
    // Fallback: look up by (title, author) when googleBooksId is missing
    const searchUrl =
      `${supabaseUrl}/rest/v1/books` +
      `?title=ilike.${encodeURIComponent(title)}` +
      `&author=ilike.${encodeURIComponent(author)}` +
      `&select=id` +
      `&limit=1`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    if (searchRes.ok) {
      const existing = await searchRes.json().catch(() => []);
      if (Array.isArray(existing) && existing.length > 0) {
        return existing[0].id;
      }
    }
  }

  // Create new book
  const createUrl = `${supabaseUrl}/rest/v1/books`;
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      title: title,
      author: author,
      google_books_id: googleBooksId,
      isbn: isbn,
      description: metadata.description || null,
      cover_url: metadata.cover_url || null,
      published_date: metadata.published_date || null,
      categories: metadata.categories || [],
      page_count: metadata.page_count || null,
      publisher: metadata.publisher || null,
      language: metadata.language || null,
      status: 'active'
    })
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();

    // If 409 conflict (book already exists), retrieve it
    if (createRes.status === 409 && googleBooksId) {
      const retrievalUrl = `${supabaseUrl}/rest/v1/books?google_books_id=eq.${encodeURIComponent(googleBooksId)}&select=id`;
      const existingRes = await fetch(retrievalUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const existingBooks = await existingRes.json();
      if (existingBooks && existingBooks.length > 0) {
        return existingBooks[0].id;
      }
    }

    // Fallback: 409 by (title, author)
    if (createRes.status === 409 && title && author) {
      const retrievalUrl =
        `${supabaseUrl}/rest/v1/books` +
        `?title=ilike.${encodeURIComponent(title)}` +
        `&author=ilike.${encodeURIComponent(author)}` +
        `&select=id` +
        `&limit=1`;
      const existingRes = await fetch(retrievalUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (existingRes.ok) {
        const existingBooks = await existingRes.json().catch(() => []);
        if (Array.isArray(existingBooks) && existingBooks.length > 0) {
          return existingBooks[0].id;
        }
      }
    }

    throw new Error(`Failed to create book: ${createRes.status}`);
  }

  const newBook = await createRes.json();

  if (!newBook || !newBook[0] || !newBook[0].id) {
    throw new Error('Failed to create book - invalid response');
  }

  console.log(`[DB] Book created: ${title} by ${author} (${newBook[0].id})`);
  return newBook[0].id;
}
