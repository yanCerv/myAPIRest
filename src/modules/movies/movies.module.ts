import { Module } from '@nestjs/common';
import { TMDB_CLIENT } from './application/tmdb-client.port.js';
import { MoviesService } from './application/movies.service.js';
import { TmdbHttpClient } from './infrastructure/tmdb-http.client.js';
import { MoviesController } from './presentation/movies.controller.js';

@Module({
  controllers: [MoviesController],
  providers: [
    MoviesService,
    { provide: TMDB_CLIENT, useClass: TmdbHttpClient },
  ],
  exports: [MoviesService],
})
export class MoviesModule {}
