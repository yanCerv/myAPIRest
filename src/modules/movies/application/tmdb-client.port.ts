export type MovieCollection = 'now_playing' | 'popular' | 'top_rated' | 'upcoming';

export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  original_language: string;
  vote_average: number;
}

export interface TmdbMovieCollectionResponse {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
  dates?: { maximum: string; minimum: string };
}

export interface TmdbMovieDetail extends TmdbMovie {
  tagline: string | null;
  homepage: string | null;
  runtime: number | null;
  budget: number | null;
  revenue: number | null;
  status: string | null;
  popularity: number | null;
  vote_count: number | null;
  adult: boolean;
  genres: Array<{ id: number; name: string }>;
  production_companies: Array<{ id: number; name: string; logo_path: string | null; origin_country: string | null }>;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages: Array<{ english_name: string; iso_639_1: string; name: string }>;
}

export interface TmdbClient {
  getCollection(input: { collection: MovieCollection; language: string; page: number }): Promise<TmdbMovieCollectionResponse>;
  getMovieDetail(input: { movieId: number; language: string }): Promise<TmdbMovieDetail>;
}

export const TMDB_CLIENT = Symbol('TMDB_CLIENT');

export class TmdbNotFoundError extends Error {
  constructor() { super('TMDB movie was not found.'); this.name = 'TmdbNotFoundError'; }
}

export class TmdbRateLimitedError extends Error {
  constructor() { super('TMDB rate limit reached.'); this.name = 'TmdbRateLimitedError'; }
}

export class TmdbUnavailableError extends Error {
  constructor() { super('TMDB is unavailable.'); this.name = 'TmdbUnavailableError'; }
}
