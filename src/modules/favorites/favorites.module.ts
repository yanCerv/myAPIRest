import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module.js';
import { MoviesModule } from '../movies/movies.module.js';
import { MOVIE_FAVORITE_REPOSITORY } from './application/movie-favorite.repository.js';
import { MovieFavoritesService } from './application/movie-favorites.service.js';
import { PrismaMovieFavoriteRepository } from './infrastructure/prisma-movie-favorite.repository.js';
import { MovieFavoritesController } from './presentation/movie-favorites.controller.js';

@Module({
  imports: [PrismaModule, MoviesModule],
  controllers: [MovieFavoritesController],
  providers: [
    MovieFavoritesService,
    { provide: MOVIE_FAVORITE_REPOSITORY, useClass: PrismaMovieFavoriteRepository },
  ],
})
export class FavoritesModule {}
