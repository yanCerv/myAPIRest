import { describe, expect, it, vi } from 'vitest';
import { MovieFavoritesService } from './movie-favorites.service.js';

const favorite = {
  id: 'favorite-id',
  userId: 'user-id',
  tmdbMovieId: 42,
  title: 'A movie',
  posterPath: '/poster.jpg',
  createdAt: new Date(),
};

function createService() {
  const favorites = {
    findByUserAndMovie: vi.fn().mockResolvedValue(null),
    listForUser: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(favorite),
    delete: vi.fn(),
  };
  const movies = {
    getMovieDetail: vi.fn().mockResolvedValue({
      id: 42,
      title: 'A movie',
      poster_path: '/poster.jpg',
    }),
  };
  return { service: new MovieFavoritesService(favorites, movies as never), favorites, movies };
}

describe('MovieFavoritesService', () => {
  it('validates a new favorite against MovieDB before saving its snapshot', async () => {
    const { service, favorites, movies } = createService();

    await service.add('user-id', 42);

    expect(movies.getMovieDetail).toHaveBeenCalledWith(42);
    expect(favorites.create).toHaveBeenCalledWith({
      userId: 'user-id',
      tmdbMovieId: 42,
      title: 'A movie',
      posterPath: '/poster.jpg',
    });
  });

  it('returns an existing favorite without calling MovieDB again', async () => {
    const { service, favorites, movies } = createService();
    vi.mocked(favorites.findByUserAndMovie).mockResolvedValue(favorite);

    await expect(service.add('user-id', 42)).resolves.toEqual(favorite);

    expect(movies.getMovieDetail).not.toHaveBeenCalled();
    expect(favorites.create).not.toHaveBeenCalled();
  });

  it('removes only the requested movie for the authenticated user', async () => {
    const { service, favorites } = createService();

    await service.remove('user-id', 42);

    expect(favorites.delete).toHaveBeenCalledWith('user-id', 42);
  });
});
