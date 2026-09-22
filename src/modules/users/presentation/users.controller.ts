import { Controller, Get, NotFoundException, Req, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/infrastructure/access-token.guard.js';
import type { AuthenticatedRequest } from '../../auth/infrastructure/access-token.guard.js';
import { FindUserByIdUseCase } from '../application/find-user-by-id.use-case.js';

@Controller('users')
export class UsersController {
  constructor(private readonly findUserById: FindUserByIdUseCase) {}

  @Get('me')
  @UseGuards(AccessTokenGuard)
  async me(@Req() request: AuthenticatedRequest) {
    const user = await this.findUserById.execute(request.auth!.userId);
    if (!user || !user.isActive) throw new NotFoundException('User not found.');
    return {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
