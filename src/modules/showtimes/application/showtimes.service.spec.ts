import { describe, expect, it } from 'vitest';
import { ShowtimesService } from './showtimes.service.js';

describe('ShowtimesService', () => {
  const service = new ShowtimesService();

  it('returns stable demo showtimes for the requested movie and date', () => {
    const response = service.getMovieShowtimes(11982, '2026-10-07');

    expect(response).toMatchObject({
      movieId: 11982,
      date: '2026-10-07',
      timeZone: 'America/Mexico_City',
    });
    expect(response.showtimes).toHaveLength(3);
    expect(response.showtimes[0]).toMatchObject({
      id: 'demo-11982-2026-10-07-cine-3-1645',
      startsAt: '2026-10-07T16:45:00-06:00',
      currency: 'MXN',
    });
    expect(service.getMovieShowtimes(11982, '2026-10-07')).toEqual(response);
  });

  it('changes the stable showtime identifiers when the date changes', () => {
    const today = service.getMovieShowtimes(11982, '2026-10-07');
    const tomorrow = service.getMovieShowtimes(11982, '2026-10-08');

    expect(tomorrow.showtimes[0]?.id).not.toBe(today.showtimes[0]?.id);
  });
});
