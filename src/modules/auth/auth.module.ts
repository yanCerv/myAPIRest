import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module.js';
import { UsersModule } from '../users/users.module.js';
import { ACCESS_TOKEN_ISSUER } from './application/access-token-issuer.port.js';
import { PASSWORD_HASHER } from './application/password-hasher.port.js';
import { REFRESH_SESSION_REPOSITORY } from './application/refresh-session.repository.js';
import { LoginUserUseCase } from './application/login-user.use-case.js';
import { LogoutUserSessionUseCase } from './application/logout-user-session.use-case.js';
import { RefreshUserSessionUseCase } from './application/refresh-user-session.use-case.js';
import { RegisterUserUseCase } from './application/register-user.use-case.js';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher.js';
import { JwtAccessTokenIssuer } from './infrastructure/jwt-access-token-issuer.js';
import { AccessTokenGuard } from './infrastructure/access-token.guard.js';
import { PrismaRefreshSessionRepository } from './infrastructure/prisma-refresh-session.repository.js';
import { AuthController } from './presentation/auth.controller.js';

@Global()
@Module({
  imports: [JwtModule.register({ global: true }), PrismaModule, UsersModule],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    AccessTokenGuard,
    LogoutUserSessionUseCase,
    RefreshUserSessionUseCase,
    {
      provide: PASSWORD_HASHER,
      useClass: Argon2PasswordHasher,
    },
    {
      provide: ACCESS_TOKEN_ISSUER,
      useClass: JwtAccessTokenIssuer,
    },
    {
      provide: REFRESH_SESSION_REPOSITORY,
      useClass: PrismaRefreshSessionRepository,
    },
  ],
  exports: [AccessTokenGuard],
})
export class AuthModule {}
