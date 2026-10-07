import { Inject, Injectable } from '@nestjs/common';
import { MoviesService } from '../../movies/application/movies.service.js';
import { MOVIE_FAVORITE_REPOSITORY } from './movie-favorite.repository.js';
import type { MovieFavorite, MovieFavoriteRepository } from './movie-favorite.repository.js';

@Injectable()
export class MovieFavoritesService {
  constructor(
    @Inject(MOVIE_FAVORITE_REPOSITORY)
    private readonly favorites: MovieFavoriteRepository,
    private readonly movies: MoviesService,
  ) {}

  list(userId: string): Promise<MovieFavorite[]> {
    return this.favorites.listForUser(userId);
  }

  async add(userId: string, tmdbMovieId: number): Promise<MovieFavorite> {
    const existing = await this.favorites.findByUserAndMovie(userId, tmdbMovieId);
    if (existing) return existing;

    const movie = await this.movies.getMovieDetail(tmdbMovieId);
    return this.favorites.create({
      userId,
      tmdbMovieId: movie.id,
      title: movie.title,
      posterPath: movie.poster_path,
    });
  }

  async remove(userId: string, tmdbMovieId: number): Promise<void> {
    await this.favorites.delete(userId, tmdbMovieId);
  }
}
