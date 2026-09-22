import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../domain/user.repository.js';
import type { UserRepository } from '../domain/user.repository.js';
import type { User } from '../domain/user.js';

@Injectable()
export class FindUserByEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  execute(email: string): Promise<User | null> {
    return this.users.findByEmail(email.trim().toLowerCase());
  }
}
