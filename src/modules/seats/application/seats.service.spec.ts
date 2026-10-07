import { describe, expect, it } from 'vitest';
import { SeatsService } from './seats.service.js';
import { ShowtimesService } from '../../showtimes/application/showtimes.service.js';

describe('SeatsService', () => {
  const service = new SeatsService(new ShowtimesService());
  const showtimeId = 'demo-11982-2026-10-07-cine-3-1645';

  it('returns a stable seat map for a valid demo showtime', () => {
    const response = service.getSeatMap(showtimeId);

    expect(response?.showtimeId).toBe(showtimeId);
    expect(response?.rows).toHaveLength(15);
    expect(response?.rows.flatMap((row) => row.seats)).toHaveLength(160);
    expect(response?.rows[0]?.seats[0]).toMatchObject({
      id: `${showtimeId}:A-1`,
      seatNumber: '1',
      type: 'RELAX',
      status: 'AVAILABLE',
      position: { rowIndex: 0, columnIndex: 2 },
    });
    expect(response?.rows[7]?.seats).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'SOFA', position: { rowIndex: 7, columnIndex: 5 } }),
      expect.objectContaining({ type: 'SOFA', position: { rowIndex: 7, columnIndex: 7 } }),
    ]));
    expect(service.getSeatMap(showtimeId)).toEqual(response);
  });

  it('does not expose a map for an unknown showtime', () => {
    expect(service.getSeatMap('unknown-showtime')).toBeNull();
  });
});
