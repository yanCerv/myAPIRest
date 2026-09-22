import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import type {
  CreateRefreshSessionData,
  RefreshSession,
  RefreshSessionRepository,
  RotateRefreshSessionData,
} from '../application/refresh-session.repository.js';

@Injectable()
export class PrismaRefreshSessionRepository implements RefreshSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRefreshSessionData): Promise<void> {
    await this.prisma.refreshSession.create({ data });
  }

  async findById(id: string): Promise<RefreshSession | null> {
    const session = await this.prisma.refreshSession.findUnique({
      where: { id },
      include: { user: { select: { isActive: true } } },
    });
    if (!session) return null;
    return {
      id: session.id, userId: session.userId, tokenHash: session.tokenHash,
      expiresAt: session.expiresAt, absoluteExpiresAt: session.absoluteExpiresAt, revokedAt: session.revokedAt,
      version: session.version, userIsActive: session.user.isActive,
    };
  }

  async rotate(data: RotateRefreshSessionData): Promise<boolean> {
    const result = await this.prisma.refreshSession.updateMany({
      where: { id: data.id, version: data.expectedVersion, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { tokenHash: data.tokenHash, expiresAt: data.expiresAt, version: { increment: 1 } },
    });
    return result.count === 1;
  }

  async revoke(id: string, expectedVersion: number): Promise<boolean> {
    const result = await this.prisma.refreshSession.updateMany({
      where: { id, version: expectedVersion, revokedAt: null },
      data: { revokedAt: new Date(), version: { increment: 1 } },
    });
    return result.count === 1;
  }
}
