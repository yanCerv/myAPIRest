export interface TicketmasterEventsQuery {
  countryCode: string;
  size: number;
  page: number;
}

export type TicketmasterResponse = Record<string, unknown>;

export interface TicketmasterClient {
  getEvents(query: TicketmasterEventsQuery): Promise<TicketmasterResponse>;
  getClassifications(): Promise<TicketmasterResponse>;
}

export const TICKETMASTER_CLIENT = Symbol('TICKETMASTER_CLIENT');

export class TicketmasterRateLimitedError extends Error {
  constructor() { super('Ticketmaster rate limit reached.'); this.name = 'TicketmasterRateLimitedError'; }
}

export class TicketmasterUnavailableError extends Error {
  constructor() { super('Ticketmaster is unavailable.'); this.name = 'TicketmasterUnavailableError'; }
}
