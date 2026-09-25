import { Module } from '@nestjs/common';
import { EventsService } from './application/events.service.js';
import { TICKETMASTER_CLIENT } from './application/ticketmaster-client.port.js';
import { TicketmasterHttpClient } from './infrastructure/ticketmaster-http.client.js';
import { EventsController } from './presentation/events.controller.js';

@Module({
  controllers: [EventsController],
  providers: [
    EventsService,
    { provide: TICKETMASTER_CLIENT, useClass: TicketmasterHttpClient },
  ],
})
export class EventsModule {}
