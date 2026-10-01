import { Inject, Injectable } from '@nestjs/common';
import { USER_PROFILE_REPOSITORY } from '../domain/user-profile.repository.js';
import type { UpsertUserProfileData, UserProfileRepository } from '../domain/user-profile.repository.js';
import type { UserProfile } from '../domain/user-profile.js';

@Injectable()
export class UpsertUserProfileUseCase {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly profiles: UserProfileRepository,
  ) {}

  execute(data: UpsertUserProfileData): Promise<UserProfile> {
    return this.profiles.upsert({
      userId: data.userId,
      firstName: this.clean(data.firstName, 100),
      lastName: this.clean(data.lastName, 100),
      avatarUrl: this.clean(data.avatarUrl, 2_048),
      locale: this.clean(data.locale, 35),
    });
  }

  private clean(value: string | null | undefined, maximumLength: number): string | null {
    const normalized = value?.trim();
    return normalized ? normalized.slice(0, maximumLength) : null;
  }
}
