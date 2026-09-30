import { User } from './user.js';

export interface CreateUserData {
  email: string;
  passwordHash: string | null;
}

export interface UserRepository {
  create(data: CreateUserData): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
