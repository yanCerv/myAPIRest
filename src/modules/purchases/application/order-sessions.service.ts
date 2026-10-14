import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { SeatsService, type ShowtimeSeat } from '../../seats/application/seats.service.js';
import { ShowtimesService } from '../../showtimes/application/showtimes.service.js';

const HOLD_DURATION_MS = 10 * 60 * 1000;

export class SeatsUnavailableError extends Error {
  constructor() {
    super('Seats are no longer available.');
    this.name = 'SeatsUnavailableError';
  }
}

export class OrderSessionNotFoundError extends Error {
  constructor() {
    super('Order session not found.');
    this.name = 'OrderSessionNotFoundError';
  }
}

export interface CreateOrderSessionInput {
  showtimeId: string;
  seatIds: string[];
  buyer: { firstName: string; lastName: string; email: string };
}

@Injectable()
export class OrderSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly showtimes: ShowtimesService,
    private readonly seats: SeatsService,
  ) {}

  async reserveForPayPal(userId: string, input: CreateOrderSessionInput) {
    const showtime = this.showtimes.findMovieShowtime(input.showtimeId);
    if (!showtime) throw new OrderSessionNotFoundError();

    const seatMap = await this.seats.getSeatMap(input.showtimeId);
    const availableSeats = new Map<string, ShowtimeSeat>();
    for (const row of seatMap?.rows ?? []) {
      for (const seat of row.seats) if (seat.status === 'AVAILABLE') availableSeats.set(seat.id, seat);
    }
    const selectedSeats = input.seatIds.map((seatId) => availableSeats.get(seatId));
    if (selectedSeats.some((seat) => !seat)) throw new SeatsUnavailableError();

    const expiresAt = new Date(Date.now() + HOLD_DURATION_MS);
    const totalCents = (selectedSeats as ShowtimeSeat[]).reduce((total, seat) => total + Math.round(seat.price * 100), 0);

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${input.showtimeId}))`;
        const now = new Date();
        await tx.orderSession.updateMany({
          where: { status: 'PENDING_PAYMENT', expiresAt: { lte: now } },
          data: { status: 'EXPIRED' },
        });
        await tx.seatHold.deleteMany({ where: { expiresAt: { lte: now } } });

        return tx.orderSession.create({
          data: {
            userId,
            paymentProvider: 'PAYPAL',
            showtimeId: input.showtimeId,
            buyerFirstName: input.buyer.firstName,
            buyerLastName: input.buyer.lastName,
            buyerEmail: input.buyer.email,
            totalCents,
            currency: showtime.currency,
            expiresAt,
            seatHolds: {
              create: input.seatIds.map((seatId) => ({ showtimeId: input.showtimeId, seatId, expiresAt })),
            },
          },
          include: { seatHolds: true },
        });
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new SeatsUnavailableError();
      throw error;
    }
  }

  async attachPayPalOrder(userId: string, sessionId: string, paypalOrderId: string) {
    const result = await this.prisma.orderSession.updateMany({
      where: { id: sessionId, userId, status: 'PENDING_PAYMENT', expiresAt: { gt: new Date() }, paypalOrderId: null },
      data: { paypalOrderId },
    });
    if (result.count !== 1) throw new OrderSessionNotFoundError();
  }

  async cancel(sessionId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.orderSession.updateMany({
        where: { id: sessionId, status: 'PENDING_PAYMENT' },
        data: { status: 'CANCELLED' },
      });
      await tx.seatHold.deleteMany({ where: { orderSessionId: sessionId } });
    });
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
