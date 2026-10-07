import { Injectable } from '@nestjs/common';

export interface MovieShowtime {
  id: string;
  movieId: number;
  startsAt: string;
  time: string;
  cinema: string;
  auditorium: string;
  screenType: string;
  price: number;
  currency: 'MXN';
}

export interface MovieShowtimesResponse {
  movieId: number;
  date: string;
  timeZone: 'America/Mexico_City';
  showtimes: MovieShowtime[];
}

interface ShowtimeTemplate {
  time: string;
  cinema: string;
  auditorium: string;
  screenType: string;
  price: number;
}

const SHOWTIME_TEMPLATES: readonly ShowtimeTemplate[] = [
  { time: '10:00', cinema: 'Cine 1', auditorium: 'Sala 2', screenType: '2D', price: 35 },
  { time: '13:30', cinema: 'Cine Premium', auditorium: 'Sala 1', screenType: '3D', price: 50 },
  { time: '16:45', cinema: 'Cine 3', auditorium: 'Sala 4', screenType: '4K Dolby Atmos', price: 45 },
  { time: '19:30', cinema: 'Cine VIP', auditorium: 'Sala 6', screenType: 'IMAX', price: 55 },
  { time: '22:15', cinema: 'Cine 5', auditorium: 'Sala 3', screenType: '2D', price: 40 },
];

@Injectable()
export class ShowtimesService {
  getMovieShowtimes(movieId: number, date: string): MovieShowtimesResponse {
    const startIndex = movieId % SHOWTIME_TEMPLATES.length;
    const numberOfShowtimes = 3 + (movieId % 3);
    const templates = Array.from({ length: numberOfShowtimes }, (_, index) => {
      return SHOWTIME_TEMPLATES[(startIndex + index) % SHOWTIME_TEMPLATES.length];
    });

    return {
      movieId,
      date,
      timeZone: 'America/Mexico_City',
      showtimes: templates.map((template) => ({
        id: this.showtimeId(movieId, date, template),
        movieId,
        startsAt: `${date}T${template.time}:00-06:00`,
        time: template.time,
        cinema: template.cinema,
        auditorium: template.auditorium,
        screenType: template.screenType,
        price: template.price,
        currency: 'MXN',
      })),
    };
  }

  findMovieShowtime(showtimeId: string): MovieShowtime | null {
    const match = /^demo-(\d+)-(\d{4}-\d{2}-\d{2})-(.+)-(\d{4})$/.exec(showtimeId);
    if (!match) return null;

    const movieId = Number(match[1]);
    const date = match[2];
    if (!Number.isSafeInteger(movieId) || movieId < 1 || !this.isCalendarDate(date)) return null;

    return this.getMovieShowtimes(movieId, date).showtimes.find((showtime) => showtime.id === showtimeId) ?? null;
  }

  private showtimeId(movieId: number, date: string, template: ShowtimeTemplate): string {
    const cinema = template.cinema.toLowerCase().replaceAll(' ', '-');
    return `demo-${movieId}-${date}-${cinema}-${template.time.replace(':', '')}`;
  }

  private isCalendarDate(date: string): boolean {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
  }
}
