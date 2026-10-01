export interface UserProfile {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  locale: string | null;
  createdAt: Date;
  updatedAt: Date;
}
