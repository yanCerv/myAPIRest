import { Controller, Delete, Get, HttpCode, HttpException, HttpStatus, NotFoundException, Param, Post, ServiceUnavailableException, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../../auth/infrastructure/access-token.guard.js';
import type { AuthenticatedRequest } from '../../auth/infrastructure/access-token.guard.js';
import { TmdbNotFoundError, TmdbRateLimitedError, TmdbUnavailableError } from '../../movies/application/tmdb-client.port.js';
import { MovieFavoritesService } from '../application/movie-favorites.service.js';
import { MovieIdParamDto } from './dto/movie-id.param.dto.js';

@ApiTags('Movie favorites')
@ApiBearerAuth('access-token')
@UseGuards(AccessTokenGuard)
@Controller('favorites/movies')
export class MovieFavoritesController {
  constructor(private readonly favorites: MovieFavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'List the current user movie favorites' })
  @ApiResponse({ status: 200, description: 'Movie favorites ordered by most recently saved.' })
  list(@Req() request: AuthenticatedRequest) {
    return this.favorites.list(request.auth!.userId);
  }

  @Post(':movieId')
  @ApiOperation({ summary: 'Save a MovieDB movie as a favorite' })
  @ApiParam({
    name: 'movieId',
    description: 'The numeric MovieDB (TMDB) movie identifier.',
    type: Number,
    example: 123,
  })
  @ApiResponse({ status: 201, description: 'Favorite created or returned when already saved.' })
  async add(@Req() request: AuthenticatedRequest, @Param() params: MovieIdParamDto) {
    try {
      return await this.favorites.add(request.auth!.userId, params.movieId);
    } catch (error) {
      if (error instanceof TmdbNotFoundError) throw new NotFoundException('Movie not found.');
      if (error instanceof TmdbRateLimitedError) throw new HttpException('TMDB rate limited.', HttpStatus.TOO_MANY_REQUESTS);
      if (error instanceof TmdbUnavailableError) throw new ServiceUnavailableException();
      throw error;
    }
  }

  @Delete(':movieId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove a movie from the current user favorites' })
  @ApiParam({
    name: 'movieId',
    description: 'The numeric MovieDB (TMDB) movie identifier.',
    type: Number,
    example: 123,
  })
  @ApiResponse({ status: 200, description: 'Favorite removed or already absent.' })
  async remove(@Req() request: AuthenticatedRequest, @Param() params: MovieIdParamDto): Promise<{ success: true }> {
    await this.favorites.remove(request.auth!.userId, params.movieId);
    return { success: true };
  }
}
