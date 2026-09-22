import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import type {
  AccountActionTokenRepository,
  CreateAccountActionTokenData,
} from '../application/account-action-token.repository.js';

@Injectable()
export class PrismaAccountActionTokenRepository
  implements AccountActionTokenRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async replacePending(data: CreateAccountActionTokenData): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.accountActionToken.deleteMany({
        where: {
          userId: data.userId,
          purpose: data.purpose,
          consumedAt: null,
        },
      }),
      this.prisma.accountActionToken.create({ data }),
    ]);
  }

  async findPending(userId: string, purpose: CreateAccountActionTokenData['purpose']) {
    const token = await this.prisma.accountActionToken.findFirst({
      where: { userId, purpose, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!token) return null;
    return {
      id: token.id,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      attempts: token.attempts,
    };
  }

  async registerFailedAttempt(tokenId: string): Promise<void> {
    const token = await this.prisma.accountActionToken.update({
      where: { id: tokenId },
      data: { attempts: { increment: 1 } },
    });
    if (token.attempts >= 5) {
      await this.prisma.accountActionToken.update({
        where: { id: tokenId },
        data: { consumedAt: new Date() },
      });
    }
  }

  async consume(tokenId: string): Promise<boolean> {
    const result = await this.prisma.accountActionToken.updateMany({
      where: { id: tokenId, consumedAt: null, expiresAt: { gt: new Date() }, attempts: { lt: 5 } },
      data: { consumedAt: new Date() },
    });
    return result.count === 1;
  }
}
