import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { ShowtimesService } from '../../showtimes/application/showtimes.service.js';

export type SeatStatus = 'AVAILABLE' | 'SOLD';
export type SeatType = 'MOTION' | 'CONFORT' | 'PREMIUM' | 'SOFA' | 'RELAX';

export interface ShowtimeSeat {
  id: string;
  seatNumber: string;
  type: SeatType;
  status: SeatStatus;
  price: number;
  position: {
    rowIndex: number;
    columnIndex: number;
  };
}

export interface ShowtimeSeatRow {
  id: string;
  rowName: string;
  seats: ShowtimeSeat[];
}

export interface ShowtimeSeatMapResponse {
  showtimeId: string;
  rows: ShowtimeSeatRow[];
}

interface SeatRowLayout {
  rowName: string;
  type: SeatType | null;
  columnIndexes: readonly number[];
}

const consecutiveColumns = (from: number, through: number): number[] => {
  return Array.from({ length: through - from + 1 }, (_, index) => from + index);
};

const SEAT_LAYOUT: readonly SeatRowLayout[] = [
  { rowName: 'A', type: 'RELAX', columnIndexes: consecutiveColumns(2, 17) },
  { rowName: 'B', type: 'RELAX', columnIndexes: consecutiveColumns(2, 17) },
  { rowName: 'C', type: 'CONFORT', columnIndexes: consecutiveColumns(3, 18) },
  { rowName: 'D', type: 'CONFORT', columnIndexes: consecutiveColumns(3, 18) },
  { rowName: 'E', type: 'CONFORT', columnIndexes: consecutiveColumns(3, 18) },
  { rowName: 'F', type: 'PREMIUM', columnIndexes: consecutiveColumns(3, 18) },
  { rowName: 'G', type: 'PREMIUM', columnIndexes: consecutiveColumns(3, 18) },
  { rowName: 'H', type: 'SOFA', columnIndexes: [5, 7, 9, 11, 13, 15] },
  { rowName: 'I', type: 'SOFA', columnIndexes: [5, 7, 9, 11, 13, 15] },
  { rowName: 'J', type: 'MOTION', columnIndexes: consecutiveColumns(1, 18) },
  { rowName: 'K', type: 'MOTION', columnIndexes: consecutiveColumns(1, 18) },
  { rowName: 'L', type: null, columnIndexes: [] },
  { rowName: 'M', type: null, columnIndexes: [] },
  { rowName: 'N', type: null, columnIndexes: [] },
  { rowName: 'O', type: null, columnIndexes: [] },
];

@Injectable()
export class SeatsService {
  constructor(
    private readonly showtimes: ShowtimesService,
    private readonly prisma: PrismaService,
  ) {}

  async getSeatMap(showtimeId: string): Promise<ShowtimeSeatMapResponse | null> {
    const showtime = this.showtimes.findMovieShowtime(showtimeId);
    if (!showtime) return null;

    const purchasedSeats = await this.prisma.purchaseSeat.findMany({
      where: { showtimeId },
      select: { seatId: true },
    });
    const purchasedSeatIds = new Set(purchasedSeats.map((seat) => seat.seatId));
    const heldSeats = await this.prisma.seatHold.findMany({
      where: { showtimeId, expiresAt: { gt: new Date() } },
      select: { seatId: true },
    });
    const heldSeatIds = new Set(heldSeats.map((seat) => seat.seatId));

    return {
      showtimeId,
      rows: SEAT_LAYOUT.map((layout, rowIndex) => {
        const type = layout.type;
        const seats = type === null
          ? []
          : layout.columnIndexes.map((columnIndex, seatIndex) => {
            const id = `${showtimeId}:${layout.rowName}-${seatIndex + 1}`;
            const status: SeatStatus = this.isSold(showtimeId, rowIndex, seatIndex) || purchasedSeatIds.has(id) || heldSeatIds.has(id)
              ? 'SOLD'
              : 'AVAILABLE';
            return {
              id,
              seatNumber: String(seatIndex + 1),
              type,
              status,
              price: showtime.price,
              position: { rowIndex, columnIndex },
            };
          });

        return {
          id: `${showtimeId}:${layout.rowName}`,
          rowName: layout.rowName,
          seats,
        };
      }),
    };
  }

  private isSold(showtimeId: string, rowIndex: number, seatIndex: number): boolean {
    const seed = [...showtimeId].reduce((total, character) => total + character.charCodeAt(0), 0);
    return (seed + rowIndex * 7 + seatIndex * 3) % 11 === 0;
  }
}
