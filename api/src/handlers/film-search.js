// Handler for POST /api/film-search
// Searches TMDB for movies matching the query

import { jsonResponse } from "../utils/index.js";
import { searchFilms } from "../films/index.js";

export async function handleFilmSearch(request, env, origin) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return jsonResponse({ error: "Invalid request body" }, 400, origin, env);
    }
    const query = (body.query || "").trim();

    if (!query || query.length < 2 || query.length > 200) {
      return jsonResponse(
        { error: "Query must be between 2 and 200 characters" },
        400,
        origin,
        env,
      );
    }

    // SECURITY: Validate language code against allowlist
    const VALID_LANGS = ["en","pt","es","fr","de","it","ru","hu","he","zh","ja","ko","ar","hi","fa","nl","pl","tr"];
    const lang = (body.lang || "en").split("-")[0].toLowerCase();
    if (!VALID_LANGS.includes(lang)) {
      return jsonResponse({ error: "Invalid language" }, 400, origin, env);
    }
    const options = await searchFilms(query, env, lang);

    return jsonResponse(
      {
        query,
        options,
        count: options.length,
      },
      200,
      origin,
      env,
    );
  } catch (error) {
    console.error("[FilmSearch] Error:", error.message);
    return jsonResponse({ error: "Film search failed" }, 500, origin, env);
  }
}
