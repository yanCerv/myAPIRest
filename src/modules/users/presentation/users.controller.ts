import { Controller, Get, NotFoundException, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../../auth/infrastructure/access-token.guard.js';
import type { AuthenticatedRequest } from '../../auth/infrastructure/access-token.guard.js';
import { FindUserByIdUseCase } from '../application/find-user-by-id.use-case.js';
import { FindUserProfileUseCase } from '../application/find-user-profile.use-case.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly findUserById: FindUserByIdUseCase,
    private readonly findUserProfile: FindUserProfileUseCase,
  ) {}

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Read the current user profile' })
  @ApiResponse({ status: 200, description: 'Safe profile of the authenticated user.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token.' })
  @UseGuards(AccessTokenGuard)
  async me(@Req() request: AuthenticatedRequest) {
    const user = await this.findUserById.execute(request.auth!.userId);
    if (!user || !user.isActive) throw new NotFoundException('User not found.');
    const profile = await this.findUserProfile.execute(user.id);
    return {
      id: user.id,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      profile: profile && {
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl: profile.avatarUrl,
        locale: profile.locale,
      },
    };
  }
}
