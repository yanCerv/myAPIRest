import { describe, expect, it, vi } from 'vitest';
import { MoviesService } from './movies.service.js';
import type { TmdbClient } from './tmdb-client.port.js';

describe('MoviesService', () => {
  it('caches a movie collection for repeated requests', async () => {
    const tmdb = { getCollection: vi.fn().mockResolvedValue({ page: 1, results: [], total_pages: 1, total_results: 0 }) } as unknown as TmdbClient;
    const service = new MoviesService(tmdb);
    await service.getCollection('popular', 1);
    await service.getCollection('popular', 1);
    expect(tmdb.getCollection).toHaveBeenCalledTimes(1);
  });
});
