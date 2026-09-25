import { describe, expect, it, vi } from 'vitest';
import { EventsService } from './events.service.js';
import type { TicketmasterClient } from './ticketmaster-client.port.js';

describe('EventsService', () => {
  it('caches repeated event searches with the same filters', async () => {
    const ticketmaster = {
      getEvents: vi.fn().mockResolvedValue({ _embedded: { events: [] } }),
    } as unknown as TicketmasterClient;
    const service = new EventsService(ticketmaster);
    const query = { countryCode: 'MX', size: 10, page: 0 };

    await service.getEvents(query);
    await service.getEvents(query);

    expect(ticketmaster.getEvents).toHaveBeenCalledTimes(1);
  });
});
