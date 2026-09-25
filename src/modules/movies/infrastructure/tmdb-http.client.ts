import { Injectable } from '@nestjs/common';
import type {
  MovieCollection,
  TmdbClient,
  TmdbMovieCollectionResponse,
  TmdbMovieDetail,
} from '../application/tmdb-client.port.js';
import {
  TmdbNotFoundError,
  TmdbRateLimitedError,
  TmdbUnavailableError,
} from '../application/tmdb-client.port.js';

const DEFAULT_BASE_URL = 'https://api.themoviedb.org';
const REQUEST_TIMEOUT_MS = 5_000;

@Injectable()
export class TmdbHttpClient implements TmdbClient {
  async getCollection(input: { collection: MovieCollection; language: string; page: number }): Promise<TmdbMovieCollectionResponse> {
    return this.request<TmdbMovieCollectionResponse>(`/3/movie/${input.collection}`, {
      language: input.language,
      page: String(input.page),
    });
  }

  async getMovieDetail(input: { movieId: number; language: string }): Promise<TmdbMovieDetail> {
    return this.request<TmdbMovieDetail>(`/3/movie/${input.movieId}`, { language: input.language });
  }

  private async request<T>(path: string, query: Record<string, string>): Promise<T> {
    const token = process.env.TMDB_READ_ACCESS_TOKEN?.trim();
    if (!token) throw new TmdbUnavailableError();

    const url = new URL(path, process.env.TMDB_BASE_URL?.trim() || DEFAULT_BASE_URL);
    Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.status === 404) throw new TmdbNotFoundError();
      if (response.status === 429) throw new TmdbRateLimitedError();
      if (!response.ok) throw new TmdbUnavailableError();
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof TmdbNotFoundError || error instanceof TmdbRateLimitedError || error instanceof TmdbUnavailableError) {
        throw error;
      }
      throw new TmdbUnavailableError();
    }
  }
}
