import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../../auth/infrastructure/access-token.guard.js';
import { ShowtimesService } from '../application/showtimes.service.js';
import { ShowtimesQueryDto } from './dto/showtimes-query.dto.js';

@ApiTags('Showtimes')
@ApiBearerAuth('access-token')
@UseGuards(AccessTokenGuard)
@Controller('movies')
export class ShowtimesController {
  constructor(private readonly showtimes: ShowtimesService) {}

  @Get(':movieId/showtimes')
  @ApiOperation({ summary: 'List demo cinema showtimes for a movie and date' })
  @ApiParam({
    name: 'movieId',
    description: 'The numeric MovieDB (TMDB) movie identifier.',
    type: Number,
    example: 11982,
  })
  @ApiQuery({
    name: 'date',
    description: 'Cinema date in YYYY-MM-DD format.',
    type: String,
    example: '2026-10-07',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Demo showtimes with stable identifiers for the requested movie and date.' })
  @ApiResponse({ status: 401, description: 'Authentication is required.' })
  @ApiResponse({ status: 404, description: 'Movie identifier is invalid.' })
  list(@Param('movieId') id: string, @Query() query: ShowtimesQueryDto) {
    const movieId = Number(id);
    if (!Number.isSafeInteger(movieId) || movieId < 1) throw new NotFoundException();
    return this.showtimes.getMovieShowtimes(movieId, query.date);
  }
}
