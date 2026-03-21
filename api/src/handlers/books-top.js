// ============================================================
// HANDLER - TOP BOOKS FEED
// ============================================================
// Fetches top books from NYT Bestsellers, Google Books, and
// Open Library. Normalizes, deduplicates, scores, and caches
// in KV. Returns top 50 philosophically relevant books.

import { getSecret } from "../utils/secrets.js";
import { getCorsHeaders } from "../utils/cors.js";

// ============================================================
// CONSTANTS
// ============================================================

const KV_KEY = "books:v1:top";
const KV_TTL_SECONDS = 6 * 60 * 60; // 6 hours

const BOOK_BLOCKED_CATEGORIES = [
  "cooking",
  "diet",
  "fitness",
  "celebrity",
  "sports",
  "astrology",
  "horoscope",
  "lottery",
  "gambling",
  "coloring book",
  "activity book",
];

const NYT_LISTS_TO_EXTRACT = [
  "hardcover-fiction",
  "hardcover-nonfiction",
  "paperback-trade-fiction",
  "young-adult-hardcover",
  "science",
  "philosophy",
];

// ============================================================
// DATA SOURCES
// ============================================================

async function fetchNYTBooks(apiKey) {
  const url = `https://api.nytimes.com/svc/books/v3/lists/overview.json?api-key=${apiKey}`;
  console.log("[Books] Fetching NYT Bestsellers overview...");

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[Books] NYT API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const lists = data.results?.lists || [];
    const books = [];

    for (const list of lists) {
      const listName = list.list_name_encoded || "";
      if (!NYT_LISTS_TO_EXTRACT.includes(listName)) continue;

      const displayName = list.display_name || listName;

      for (const book of list.books || []) {
        const isbn13 =
          book.primary_isbn13 ||
          (book.isbns?.length ? book.isbns[0].isbn13 : "");
        books.push({
          id: isbn13 || `nyt-${book.title}-${book.author}`,
          title: book.title || "",
          author: book.author || "",
          cover: book.book_image || "",
          publisher: book.publisher || "",
          publishedYear: "",
          description: (book.description || "").slice(0, 200),
          rank: book.rank || 0,
          source: "nyt",
          listName: `NYT ${displayName}`,
          weeksOnList: book.weeks_on_list || 0,
          isbn13: isbn13,
        });
      }
    }

    console.log(`[Books] NYT: got ${books.length} books`);
    return books;
  } catch (error) {
    console.error(`[Books] NYT fetch failed: ${error.message}`);
    return [];
  }
}

async function fetchGoogleBooks(apiKey) {
  const queries = [
    "subject:philosophy+subject:politics+subject:economics",
    "subject:fiction",
  ];
  const allBooks = [];

  for (const q of queries) {
    const orderBy = q.includes("fiction") ? "newest" : "relevance";
    const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&orderBy=${orderBy}&maxResults=20&key=${apiKey}`;
    console.log(`[Books] Fetching Google Books: ${q.slice(0, 40)}...`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`[Books] Google Books API error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const items = data.items || [];

      for (const item of items) {
        const info = item.volumeInfo || {};
        const identifiers = info.industryIdentifiers || [];
        const isbn13Entry = identifiers.find((i) => i.type === "ISBN_13");
        const isbn13 = isbn13Entry ? isbn13Entry.identifier : "";
        const imageLinks = info.imageLinks || {};

        allBooks.push({
          id: isbn13 || item.id || `google-${info.title}`,
          title: info.title || "",
          author: (info.authors || []).join(", "),
          cover:
            imageLinks.thumbnail?.replace("http://", "https://") || "",
          publisher: info.publisher || "",
          publishedYear: (info.publishedDate || "").slice(0, 4),
          description: (info.description || "").slice(0, 200),
          rank: 0,
          source: "google",
          listName: q.includes("fiction")
            ? "Google Fiction"
            : "Google Philosophy/Politics/Economics",
          weeksOnList: 0,
          isbn13: isbn13,
        });
      }
    } catch (error) {
      console.error(`[Books] Google Books fetch failed: ${error.message}`);
    }
  }

  console.log(`[Books] Google: got ${allBooks.length} books`);
  return allBooks;
}

async function fetchOpenLibraryTrending() {
  const url = "https://openlibrary.org/trending/weekly.json?limit=20";
  console.log("[Books] Fetching Open Library trending...");

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[Books] Open Library API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const works = data.works || [];
    const books = [];

    for (const work of works) {
      const coverId = work.cover_id || work.cover_i;
      const coverUrl = coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
        : "";
      const key = work.key || "";

      books.push({
        id: key || `ol-${work.title}`,
        title: work.title || "",
        author: (work.author_name || []).join(", "),
        cover: coverUrl,
        publisher: "",
        publishedYear: work.first_publish_year
          ? String(work.first_publish_year)
          : "",
        description: "",
        rank: 0,
        source: "openlibrary",
        listName: "Open Library Trending",
        weeksOnList: 0,
        isbn13: "",
      });
    }

    console.log(`[Books] Open Library: got ${books.length} books`);
    return books;
  } catch (error) {
    console.error(`[Books] Open Library fetch failed: ${error.message}`);
    return [];
  }
}

// ============================================================
// DEDUPLICATION & SCORING
// ============================================================

function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function deduplicateBooks(books) {
  const seen = new Map(); // isbn13 -> book
  const seenFuzzy = new Map(); // normalized title+author -> book

  const result = [];

  for (const book of books) {
    // Primary: ISBN13
    if (book.isbn13) {
      if (seen.has(book.isbn13)) {
        // Merge: keep the one with higher source priority
        const existing = seen.get(book.isbn13);
        if (sourceWeight(book.source) > sourceWeight(existing.source)) {
          seen.set(book.isbn13, book);
          // Replace in result
          const idx = result.indexOf(existing);
          if (idx !== -1) result[idx] = book;
        }
        continue;
      }
      seen.set(book.isbn13, book);
    }

    // Fallback: fuzzy title+author match
    const fuzzyKey = normalizeText(book.title) + "|" + normalizeText(book.author);
    if (fuzzyKey.length > 3 && seenFuzzy.has(fuzzyKey)) {
      const existing = seenFuzzy.get(fuzzyKey);
      if (sourceWeight(book.source) > sourceWeight(existing.source)) {
        seenFuzzy.set(fuzzyKey, book);
        const idx = result.indexOf(existing);
        if (idx !== -1) result[idx] = book;
      }
      continue;
    }

    seenFuzzy.set(fuzzyKey, book);
    result.push(book);
  }

  return result;
}

function sourceWeight(source) {
  if (source === "nyt") return 3;
  if (source === "openlibrary") return 2;
  if (source === "google") return 1;
  return 0;
}

function scoreBook(book) {
  let score = 0;
  if (book.source === "nyt") score += 30;
  if (book.weeksOnList > 4) score += 10;
  if (book.weeksOnList > 12) score += 10;
  if (book.source === "openlibrary") score += 15;
  if (book.source === "google") score += 10;
  return score;
}

function isPhilosophicallyRelevant(book) {
  const text = (book.title + " " + book.description).toLowerCase();
  return !BOOK_BLOCKED_CATEGORIES.some((term) => text.includes(term));
}

// ============================================================
// CORE FETCH + PROCESS
// ============================================================

export async function fetchTopBooks(env) {
  console.log("[Books] Starting top books fetch...");

  const nytKey = await getSecret(env.NYT_BOOKS_API_KEY);
  const googleKey = await getSecret(env.GOOGLE_BOOKS_API_KEY);

  // Fetch all three sources in parallel
  const [nytBooks, googleBooks, olBooks] = await Promise.all([
    nytKey ? fetchNYTBooks(nytKey) : Promise.resolve([]),
    googleKey ? fetchGoogleBooks(googleKey) : Promise.resolve([]),
    fetchOpenLibraryTrending(),
  ]);

  const allBooks = [...nytBooks, ...googleBooks, ...olBooks];
  console.log(`[Books] Total raw books: ${allBooks.length}`);

  if (allBooks.length === 0) {
    console.warn("[Books] All sources returned empty — skipping KV write");
    return null;
  }

  // Deduplicate
  const unique = deduplicateBooks(allBooks);
  console.log(`[Books] After dedup: ${unique.length}`);

  // Filter philosophical relevance
  const relevant = unique.filter(isPhilosophicallyRelevant);
  console.log(`[Books] After relevance filter: ${relevant.length}`);

  // Score and sort
  const scored = relevant
    .map((book) => ({ ...book, _score: scoreBook(book) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 50);

  // Assign final rank, remove internal score
  const ranked = scored.map((book, index) => {
    const { _score, ...rest } = book;
    return { ...rest, rank: index + 1 };
  });

  const sources = [...new Set(ranked.map((b) => b.source))];
  const payload = {
    books: ranked,
    count: ranked.length,
    fetchedAt: new Date().toISOString(),
    sources,
  };

  // Write to KV
  if (env.PHILOSIFY_KV) {
    await env.PHILOSIFY_KV.put(KV_KEY, JSON.stringify(payload), {
      expirationTtl: KV_TTL_SECONDS,
    });
    console.log(`[Books] Cached ${ranked.length} books in KV (TTL: ${KV_TTL_SECONDS}s)`);
  }

  return payload;
}

// ============================================================
// HANDLER — GET /api/books/top
// ============================================================

export async function handleBooksTop(request, env, origin, ctx) {
  const corsHeaders = getCorsHeaders(origin, env);

  try {
    // Try KV cache first
    if (env.PHILOSIFY_KV) {
      const cached = await env.PHILOSIFY_KV.get(KV_KEY);
      if (cached) {
        console.log("[Books] Serving from KV cache");

        // Background refresh if data is older than 5 hours (stale-while-revalidate)
        try {
          const parsed = JSON.parse(cached);
          const age = Date.now() - new Date(parsed.fetchedAt).getTime();
          if (age > 5 * 60 * 60 * 1000 && ctx && ctx.waitUntil) {
            console.log("[Books] Cache stale — background refresh");
            ctx.waitUntil(
              fetchTopBooks(env).catch((err) =>
                console.error("[Books] Background refresh failed:", err.message),
              ),
            );
          }
        } catch (e) {
          // Parse error — just serve the cached string
        }

        return new Response(cached, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
            ...corsHeaders,
          },
        });
      }
    }

    // No cache — fetch fresh
    console.log("[Books] No cache — fetching fresh data");
    const payload = await fetchTopBooks(env);

    if (!payload) {
      return new Response(
        JSON.stringify({
          books: [],
          count: 0,
          fetchedAt: new Date().toISOString(),
          sources: [],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=300",
            ...corsHeaders,
          },
        },
      );
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("[Books] Handler error:", error.message);
    return new Response(
      JSON.stringify({
        books: [],
        count: 0,
        fetchedAt: new Date().toISOString(),
        sources: [],
        error: "Failed to fetch top books",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }
}
