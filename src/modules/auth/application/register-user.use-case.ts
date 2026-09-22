import { Inject, Injectable } from '@nestjs/common';
import { CreateUserUseCase } from '../../users/application/create-user.use-case.js';
import { PASSWORD_HASHER } from './password-hasher.port.js';
import type { PasswordHasher } from './password-hasher.port.js';

export interface RegisterUserCommand {
  email: string;
  password: string;
}

export interface RegisteredUser {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly createUser: CreateUserUseCase,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisteredUser> {
    const passwordHash = await this.passwordHasher.hash(command.password);
    const user = await this.createUser.execute({
      email: command.email,
      passwordHash,
    });

    return {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
