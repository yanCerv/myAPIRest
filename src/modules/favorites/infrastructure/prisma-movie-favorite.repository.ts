import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import type {
  CreateMovieFavoriteData,
  MovieFavorite,
  MovieFavoriteRepository,
} from '../application/movie-favorite.repository.js';

@Injectable()
export class PrismaMovieFavoriteRepository implements MovieFavoriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndMovie(userId: string, tmdbMovieId: number): Promise<MovieFavorite | null> {
    return this.prisma.movieFavorite.findUnique({
      where: { userId_tmdbMovieId: { userId, tmdbMovieId } },
    });
  }

  listForUser(userId: string): Promise<MovieFavorite[]> {
    return this.prisma.movieFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: CreateMovieFavoriteData): Promise<MovieFavorite> {
    return this.prisma.movieFavorite.upsert({
      where: {
        userId_tmdbMovieId: {
          userId: data.userId,
          tmdbMovieId: data.tmdbMovieId,
        },
      },
      create: data,
      update: {},
    });
  }

  async delete(userId: string, tmdbMovieId: number): Promise<void> {
    await this.prisma.movieFavorite.deleteMany({ where: { userId, tmdbMovieId } });
  }
}
