import { Inject, Injectable } from '@nestjs/common';
import { FindUserByEmailUseCase } from '../../users/application/find-user-by-email.use-case.js';
import { PASSWORD_HASHER } from './password-hasher.port.js';
import type { PasswordHasher } from './password-hasher.port.js';
import { IssueUserSessionUseCase } from './issue-user-session.use-case.js';

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials.');
    this.name = 'InvalidCredentialsError';
  }
}

export interface LoginUserCommand {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  accessTokenExpiresAt: Date;
  session: { expiresAt: Date; timeZone: 'UTC' };
}

@Injectable()
export class LoginUserUseCase {
  constructor(
    private readonly findUserByEmail: FindUserByEmailUseCase,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    private readonly issueUserSession: IssueUserSessionUseCase,
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginResult> {
    const user = await this.findUserByEmail.execute(command.email);

    if (
      !user ||
      !user.isActive ||
      !user.passwordHash ||
      !(await this.passwordHasher.verify(user.passwordHash, command.password))
    ) {
      throw new InvalidCredentialsError();
    }

    return this.issueUserSession.execute(user.id);
  }

}
