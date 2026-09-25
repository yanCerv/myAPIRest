import { Controller, Get, HttpException, HttpStatus, NotFoundException, Param, Query, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../../auth/infrastructure/access-token.guard.js';
import { MoviesService } from '../application/movies.service.js';
import { TmdbNotFoundError, TmdbRateLimitedError, TmdbUnavailableError, type MovieCollection } from '../application/tmdb-client.port.js';
import { MovieListQueryDto } from './dto/movie-list-query.dto.js';

@ApiTags('Movies')
@ApiBearerAuth('access-token')
@UseGuards(AccessTokenGuard)
@Controller('movies')
export class MoviesController {
  constructor(private readonly movies: MoviesService) {}

  @Get('now-playing')
  @ApiOperation({ summary: 'List movies currently playing' })
  @ApiResponse({ status: 200, description: 'TMDB-compatible movie collection.' })
  nowPlaying(@Query() query: MovieListQueryDto) { return this.list('now_playing', query.page); }

  @Get('popular')
  @ApiOperation({ summary: 'List popular movies' })
  @ApiResponse({ status: 200, description: 'TMDB-compatible movie collection.' })
  popular(@Query() query: MovieListQueryDto) { return this.list('popular', query.page); }

  @Get('top-rated')
  @ApiOperation({ summary: 'List top rated movies' })
  @ApiResponse({ status: 200, description: 'TMDB-compatible movie collection.' })
  topRated(@Query() query: MovieListQueryDto) { return this.list('top_rated', query.page); }

  @Get('upcoming')
  @ApiOperation({ summary: 'List upcoming movies' })
  @ApiResponse({ status: 200, description: 'TMDB-compatible movie collection.' })
  upcoming(@Query() query: MovieListQueryDto) { return this.list('upcoming', query.page); }

  @Get(':id')
  @ApiOperation({ summary: 'Get a movie detail' })
  @ApiResponse({ status: 200, description: 'TMDB-compatible movie detail.' })
  @ApiResponse({ status: 404, description: 'Movie not found.' })
  detail(@Param('id') id: string) {
    const movieId = Number(id);
    if (!Number.isSafeInteger(movieId) || movieId < 1) throw new NotFoundException();
    return this.call(() => this.movies.getMovieDetail(movieId));
  }

  private list(collection: MovieCollection, page: number) {
    return this.call(() => this.movies.getCollection(collection, page));
  }

  private async call<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); }
    catch (error) {
      if (error instanceof TmdbNotFoundError) throw new NotFoundException();
      if (error instanceof TmdbRateLimitedError) throw new HttpException('TMDB rate limited.', HttpStatus.TOO_MANY_REQUESTS);
      if (error instanceof TmdbUnavailableError) throw new ServiceUnavailableException();
      throw error;
    }
  }
}
