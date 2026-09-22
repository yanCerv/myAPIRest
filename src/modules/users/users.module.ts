import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module.js';
import { CreateUserUseCase } from './application/create-user.use-case.js';
import { FindUserByIdUseCase } from './application/find-user-by-id.use-case.js';
import { USER_REPOSITORY } from './domain/user.repository.js';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository.js';

@Module({
  imports: [PrismaModule],
  providers: [
    CreateUserUseCase,
    FindUserByIdUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [CreateUserUseCase, FindUserByIdUseCase],
})
export class UsersModule {}
