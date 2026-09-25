import { Inject, Injectable } from '@nestjs/common';
import {
  TMDB_CLIENT,
  type MovieCollection,
  type TmdbClient,
  type TmdbMovieCollectionResponse,
  type TmdbMovieDetail,
} from './tmdb-client.port.js';

const CACHE_TTL_MS = 5 * 60_000;

@Injectable()
export class MoviesService {
  private readonly cache = new Map<string, { expiresAt: number; value: unknown }>();

  constructor(@Inject(TMDB_CLIENT) private readonly tmdb: TmdbClient) {}

  getCollection(collection: MovieCollection, page: number, language = 'es-MX'): Promise<TmdbMovieCollectionResponse> {
    const key = `collection:${collection}:${language}:${page}`;
    return this.getCached(key, () => this.tmdb.getCollection({ collection, language, page }));
  }

  getMovieDetail(movieId: number, language = 'es-MX'): Promise<TmdbMovieDetail> {
    const key = `movie:${movieId}:${language}`;
    return this.getCached(key, () => this.tmdb.getMovieDetail({ movieId, language }));
  }

  private async getCached<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;
    const value = await loader();
    this.cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  }
}
