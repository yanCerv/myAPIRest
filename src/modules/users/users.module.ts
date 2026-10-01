import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module.js';
import { CreateUserUseCase } from './application/create-user.use-case.js';
import { FindUserByEmailUseCase } from './application/find-user-by-email.use-case.js';
import { FindUserByIdUseCase } from './application/find-user-by-id.use-case.js';
import { USER_REPOSITORY } from './domain/user.repository.js';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository.js';
import { UsersController } from './presentation/users.controller.js';
import { FindUserProfileUseCase } from './application/find-user-profile.use-case.js';
import { UpsertUserProfileUseCase } from './application/upsert-user-profile.use-case.js';
import { USER_PROFILE_REPOSITORY } from './domain/user-profile.repository.js';
import { PrismaUserProfileRepository } from './infrastructure/prisma-user-profile.repository.js';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    FindUserByEmailUseCase,
    FindUserByIdUseCase,
    FindUserProfileUseCase,
    UpsertUserProfileUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: USER_PROFILE_REPOSITORY,
      useClass: PrismaUserProfileRepository,
    },
  ],
  exports: [
    CreateUserUseCase,
    FindUserByEmailUseCase,
    FindUserByIdUseCase,
    FindUserProfileUseCase,
    UpsertUserProfileUseCase,
    USER_REPOSITORY,
  ],
})
export class UsersModule {}
