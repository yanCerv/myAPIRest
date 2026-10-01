import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import type { UserProfileRepository, UpsertUserProfileData } from '../domain/user-profile.repository.js';
import type { UserProfile } from '../domain/user-profile.js';

@Injectable()
export class PrismaUserProfileRepository implements UserProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserProfile | null> {
    return this.prisma.userProfile.findUnique({ where: { userId } });
  }

  async upsert(data: UpsertUserProfileData): Promise<UserProfile> {
    const { userId, ...profile } = data;
    return this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...profile },
      update: profile,
    });
  }
}
