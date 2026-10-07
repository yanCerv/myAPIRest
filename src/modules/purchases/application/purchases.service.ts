import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { MoviesService } from '../../movies/application/movies.service.js';
import { SeatsService, type ShowtimeSeat } from '../../seats/application/seats.service.js';
import { ShowtimesService } from '../../showtimes/application/showtimes.service.js';
import { PaymentSandboxService } from './payment-sandbox.service.js';

export class ShowtimeNotFoundError extends Error {
  constructor() {
    super('Showtime not found.');
    this.name = 'ShowtimeNotFoundError';
  }
}

export class SeatsUnavailableError extends Error {
  constructor() {
    super('Seats are no longer available.');
    this.name = 'SeatsUnavailableError';
  }
}

export interface CreatePurchaseInput {
  showtimeId: string;
  seatIds: string[];
  buyer: { firstName: string; lastName: string; email: string };
  payment: { cardNumber: string; expiry: string; cvc: string };
}

export interface PurchaseSeatSnapshot {
  id: string;
  label: string;
  type: string;
  price: number;
}

export interface PurchaseResponse {
  id: string;
  bookingCode: string;
  status: string;
  purchasedAt: Date;
  movie: {
    id: number;
    title: string;
    posterPath: string | null;
    durationMinutes: number | null;
    genres: string[];
  };
  showtime: {
    startsAt: Date;
    cinema: string;
    auditorium: string;
    screenType: string;
  };
  seats: PurchaseSeatSnapshot[];
  payment: { method: string; last4: string; status: string };
  total: number;
  currency: string;
}

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly movies: MoviesService,
    private readonly showtimes: ShowtimesService,
    private readonly seats: SeatsService,
    private readonly payments: PaymentSandboxService,
  ) {}

  async create(userId: string, input: CreatePurchaseInput) {
    const payment = this.payments.authorize(input.payment);
    const showtime = this.showtimes.findMovieShowtime(input.showtimeId);
    if (!showtime) throw new ShowtimeNotFoundError();

    const seatMap = await this.seats.getSeatMap(input.showtimeId);
    const availableSeats = new Map<string, ShowtimeSeat>();
    for (const row of seatMap?.rows ?? []) {
      for (const seat of row.seats) {
        if (seat.status === 'AVAILABLE') availableSeats.set(seat.id, seat);
      }
    }

    const selectedSeats = input.seatIds.map((seatId) => availableSeats.get(seatId));
    if (selectedSeats.some((seat) => !seat)) throw new SeatsUnavailableError();

    const movie = await this.movies.getMovieDetail(showtime.movieId);
    const bookingCode = this.createBookingCode();
    const seatSnapshots = selectedSeats as ShowtimeSeat[];
    const totalCents = seatSnapshots.reduce((total, seat) => total + Math.round(seat.price * 100), 0);

    try {
      const purchase = await this.prisma.purchase.create({
        data: {
          bookingCode,
          userId,
          movieId: movie.id,
          movieTitle: movie.title,
          moviePosterPath: movie.poster_path,
          movieDurationMinutes: movie.runtime,
          movieGenres: movie.genres.map((genre) => genre.name),
          showtimeId: showtime.id,
          startsAt: new Date(showtime.startsAt),
          cinema: showtime.cinema,
          auditorium: showtime.auditorium,
          screenType: showtime.screenType,
          buyerFirstName: input.buyer.firstName,
          buyerLastName: input.buyer.lastName,
          buyerEmail: input.buyer.email,
          paymentMethod: payment.method,
          paymentLast4: payment.last4,
          totalCents,
          currency: showtime.currency,
          seats: {
            create: seatSnapshots.map((seat) => ({
              showtimeId: showtime.id,
              seatId: seat.id,
              label: `${seat.id.split(':').at(-1)}`,
              type: seat.type,
              priceCents: Math.round(seat.price * 100),
            })),
          },
        },
        include: { seats: true },
      });

      return this.toResponse(purchase);
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new SeatsUnavailableError();
      throw error;
    }
  }

  async listForUser(userId: string) {
    const purchases = await this.prisma.purchase.findMany({
      where: { userId },
      include: { seats: true },
      orderBy: { createdAt: 'desc' },
    });
    return purchases.map((purchase) => this.toResponse(purchase));
  }

  private createBookingCode(): string {
    return `TS-${randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`;
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }

  private toResponse(purchase: {
    id: string;
    bookingCode: string;
    status: string;
    createdAt: Date;
    movieId: number;
    movieTitle: string;
    moviePosterPath: string | null;
    movieDurationMinutes: number | null;
    movieGenres: string[];
    startsAt: Date;
    cinema: string;
    auditorium: string;
    screenType: string;
    paymentMethod: string;
    paymentLast4: string;
    paymentStatus: string;
    totalCents: number;
    currency: string;
    seats: Array<{ id: string; label: string; type: string; priceCents: number }>;
  }): PurchaseResponse {
    return {
      id: purchase.id,
      bookingCode: purchase.bookingCode,
      status: purchase.status,
      purchasedAt: purchase.createdAt,
      movie: {
        id: purchase.movieId,
        title: purchase.movieTitle,
        posterPath: purchase.moviePosterPath,
        durationMinutes: purchase.movieDurationMinutes,
        genres: purchase.movieGenres,
      },
      showtime: {
        startsAt: purchase.startsAt,
        cinema: purchase.cinema,
        auditorium: purchase.auditorium,
        screenType: purchase.screenType,
      },
      seats: purchase.seats.map((seat): PurchaseSeatSnapshot => ({
        id: seat.id,
        label: seat.label,
        type: seat.type,
        price: seat.priceCents / 100,
      })),
      payment: {
        method: purchase.paymentMethod,
        last4: purchase.paymentLast4,
        status: purchase.paymentStatus,
      },
      total: purchase.totalCents / 100,
      currency: purchase.currency,
    };
  }
}
