// Handler for POST /api/film-search
// Searches TMDB for movies matching the query

import { jsonResponse } from "../utils/index.js";
import { searchFilms } from "../films/index.js";

export async function handleFilmSearch(request, env, origin) {
  try {
    const body = await request.json();
    const query = (body.query || "").trim();

    if (!query || query.length < 2 || query.length > 200) {
      return jsonResponse(
        { error: "Query must be between 2 and 200 characters" },
        400,
        origin,
        env,
      );
    }

    const lang = (body.lang || "en").split("-")[0];
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
