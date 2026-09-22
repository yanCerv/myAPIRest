import { Controller, Get, NotFoundException, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../../auth/infrastructure/access-token.guard.js';
import type { AuthenticatedRequest } from '../../auth/infrastructure/access-token.guard.js';
import { FindUserByIdUseCase } from '../application/find-user-by-id.use-case.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly findUserById: FindUserByIdUseCase) {}

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Read the current user profile' })
  @ApiResponse({ status: 200, description: 'Safe profile of the authenticated user.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
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
