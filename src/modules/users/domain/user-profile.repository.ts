import type { UserProfile } from './user-profile.js';

export interface UpsertUserProfileData {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  locale?: string | null;
}

export interface UserProfileRepository {
  findByUserId(userId: string): Promise<UserProfile | null>;
  upsert(data: UpsertUserProfileData): Promise<UserProfile>;
}

export const USER_PROFILE_REPOSITORY = Symbol('USER_PROFILE_REPOSITORY');
