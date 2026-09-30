import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import type {
  ExternalIdentity,
  ExternalIdentityProvider,
  ExternalIdentityRepository,
} from '../application/external-identity.repository.js';

@Injectable()
export class PrismaExternalIdentityRepository implements ExternalIdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProviderUserId(
    provider: ExternalIdentityProvider,
    providerUserId: string,
  ): Promise<ExternalIdentity | null> {
    const identity = await this.prisma.externalIdentity.findUnique({
      where: { provider_providerUserId: { provider, providerUserId } },
      select: { userId: true, provider: true, providerUserId: true },
    });
    return identity;
  }

  async create(identity: ExternalIdentity): Promise<void> {
    await this.prisma.externalIdentity.create({ data: identity });
  }
}
