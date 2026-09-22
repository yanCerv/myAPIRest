import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import type {
  CreateRefreshSessionData,
  RefreshSessionRepository,
} from '../application/refresh-session.repository.js';

@Injectable()
export class PrismaRefreshSessionRepository implements RefreshSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRefreshSessionData): Promise<void> {
    await this.prisma.refreshSession.create({ data });
  }
}
