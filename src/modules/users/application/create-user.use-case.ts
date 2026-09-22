import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../domain/user.repository.js';
import type {
  CreateUserData,
  UserRepository,
} from '../domain/user.repository.js';
import {
  EmailAlreadyInUseError,
  InvalidUserEmailError,
} from '../domain/user.errors.js';
import type { User } from '../domain/user.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(data: CreateUserData): Promise<User> {
    const email = data.email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(email)) {
      throw new InvalidUserEmailError();
    }

    if (await this.users.findByEmail(email)) {
      throw new EmailAlreadyInUseError();
    }

    return this.users.create({
      email,
      passwordHash: data.passwordHash,
    });
  }
}
