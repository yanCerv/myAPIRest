import { Inject, Injectable } from '@nestjs/common';
import {
  TICKETMASTER_CLIENT,
  type TicketmasterClient,
  type TicketmasterEventsQuery,
  type TicketmasterResponse,
} from './ticketmaster-client.port.js';

const CACHE_TTL_MS = 5 * 60_000;

@Injectable()
export class EventsService {
  private readonly cache = new Map<string, { expiresAt: number; value: TicketmasterResponse }>();

  constructor(@Inject(TICKETMASTER_CLIENT) private readonly ticketmaster: TicketmasterClient) {}

  getEvents(query: TicketmasterEventsQuery): Promise<TicketmasterResponse> {
    const key = `events:${query.countryCode}:${query.size}:${query.page}`;
    return this.getCached(key, () => this.ticketmaster.getEvents(query));
  }

  getClassifications(): Promise<TicketmasterResponse> {
    return this.getCached('classifications', () => this.ticketmaster.getClassifications());
  }

  private async getCached(key: string, loader: () => Promise<TicketmasterResponse>): Promise<TicketmasterResponse> {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    const value = await loader();
    this.cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  }
}
