import { Controller, Get, HttpException, HttpStatus, Query, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../../auth/infrastructure/access-token.guard.js';
import { EventsService } from '../application/events.service.js';
import { TicketmasterRateLimitedError, TicketmasterUnavailableError } from '../application/ticketmaster-client.port.js';
import { EventsListQueryDto } from './dto/events-list-query.dto.js';

@ApiTags('Events')
@ApiBearerAuth('access-token')
@UseGuards(AccessTokenGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'List Ticketmaster events by country' })
  @ApiResponse({ status: 200, description: 'Ticketmaster-compatible event collection.' })
  list(@Query() query: EventsListQueryDto) {
    return this.call(() => this.events.getEvents(query));
  }

  @Get('classifications')
  @ApiOperation({ summary: 'List Ticketmaster classifications' })
  @ApiResponse({ status: 200, description: 'Ticketmaster-compatible classifications.' })
  classifications() {
    return this.call(() => this.events.getClassifications());
  }

  private async call<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); }
    catch (error) {
      if (error instanceof TicketmasterRateLimitedError) throw new HttpException('Ticketmaster rate limited.', HttpStatus.TOO_MANY_REQUESTS);
      if (error instanceof TicketmasterUnavailableError) throw new ServiceUnavailableException();
      throw error;
    }
  }
}
