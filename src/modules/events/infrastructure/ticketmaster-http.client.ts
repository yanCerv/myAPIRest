import { Injectable } from '@nestjs/common';
import {
  TicketmasterRateLimitedError,
  TicketmasterUnavailableError,
  type TicketmasterClient,
  type TicketmasterEventsQuery,
  type TicketmasterResponse,
} from '../application/ticketmaster-client.port.js';

const DEFAULT_BASE_URL = 'https://app.ticketmaster.com';
const REQUEST_TIMEOUT_MS = 5_000;

@Injectable()
export class TicketmasterHttpClient implements TicketmasterClient {
  getEvents(query: TicketmasterEventsQuery): Promise<TicketmasterResponse> {
    return this.request('/discovery/v2/events.json', {
      countryCode: query.countryCode,
      size: String(query.size),
      page: String(query.page),
    });
  }

  getClassifications(): Promise<TicketmasterResponse> {
    return this.request('/discovery/v2/classifications.json');
  }

  private async request(path: string, query: Record<string, string> = {}): Promise<TicketmasterResponse> {
    const apiKey = process.env.TICKETMASTER_API_KEY?.trim();
    if (!apiKey) throw new TicketmasterUnavailableError();

    const url = new URL(path, process.env.TICKETMASTER_BASE_URL?.trim() || DEFAULT_BASE_URL);
    url.searchParams.set('apikey', apiKey);
    Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.status === 429) throw new TicketmasterRateLimitedError();
      if (!response.ok) throw new TicketmasterUnavailableError();
      return (await response.json()) as TicketmasterResponse;
    } catch (error) {
      if (error instanceof TicketmasterRateLimitedError || error instanceof TicketmasterUnavailableError) throw error;
      throw new TicketmasterUnavailableError();
    }
  }
}
