export interface MovieFavorite {
  id: string;
  userId: string;
  tmdbMovieId: number;
  title: string;
  posterPath: string | null;
  createdAt: Date;
}

export interface CreateMovieFavoriteData {
  userId: string;
  tmdbMovieId: number;
  title: string;
  posterPath: string | null;
}

export interface MovieFavoriteRepository {
  findByUserAndMovie(userId: string, tmdbMovieId: number): Promise<MovieFavorite | null>;
  listForUser(userId: string): Promise<MovieFavorite[]>;
  create(data: CreateMovieFavoriteData): Promise<MovieFavorite>;
  delete(userId: string, tmdbMovieId: number): Promise<void>;
}

export const MOVIE_FAVORITE_REPOSITORY = Symbol('MOVIE_FAVORITE_REPOSITORY');
