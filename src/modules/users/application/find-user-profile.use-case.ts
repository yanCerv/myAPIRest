import { Inject, Injectable } from '@nestjs/common';
import { USER_PROFILE_REPOSITORY } from '../domain/user-profile.repository.js';
import type { UserProfileRepository } from '../domain/user-profile.repository.js';
import type { UserProfile } from '../domain/user-profile.js';

@Injectable()
export class FindUserProfileUseCase {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly profiles: UserProfileRepository,
  ) {}

  execute(userId: string): Promise<UserProfile | null> {
    return this.profiles.findByUserId(userId);
  }
}
