import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../../auth/infrastructure/access-token.guard.js';
import { SeatsService } from '../application/seats.service.js';

@ApiTags('Showtime seats')
@ApiBearerAuth('access-token')
@UseGuards(AccessTokenGuard)
@Controller('showtimes')
export class SeatsController {
  constructor(private readonly seats: SeatsService) {}

  @Get(':showtimeId/seats')
  @ApiOperation({ summary: 'Get the demo seat map for a showtime' })
  @ApiParam({
    name: 'showtimeId',
    description: 'The stable showtime identifier returned by the movie showtimes endpoint.',
    type: String,
    example: 'demo-11982-2026-10-07-cine-3-1645',
  })
  @ApiResponse({ status: 200, description: 'Seat map with stable seat identifiers and availability state.' })
  @ApiResponse({ status: 401, description: 'Authentication is required.' })
  @ApiResponse({ status: 404, description: 'Showtime does not exist.' })
  getSeatMap(@Param('showtimeId') showtimeId: string) {
    const response = this.seats.getSeatMap(showtimeId);
    if (!response) throw new NotFoundException();
    return response;
  }
}
