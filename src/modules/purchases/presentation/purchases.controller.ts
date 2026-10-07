import { BadRequestException, ConflictException, Controller, Get, HttpException, HttpStatus, NotFoundException, Post, Body, Req, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard, type AuthenticatedRequest } from '../../auth/infrastructure/access-token.guard.js';
import { TmdbNotFoundError, TmdbRateLimitedError, TmdbUnavailableError } from '../../movies/application/tmdb-client.port.js';
import { PaymentDeclinedError, PaymentInvalidDetailsError } from '../application/payment-sandbox.service.js';
import { PurchasesService, SeatsUnavailableError, ShowtimeNotFoundError } from '../application/purchases.service.js';
import { CreatePurchaseDto } from './dto/create-purchase.dto.js';

@ApiTags('Purchases')
@ApiBearerAuth('access-token')
@UseGuards(AccessTokenGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchases: PurchasesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a confirmed movie-ticket purchase using the sandbox payment gateway' })
  @ApiBody({ type: CreatePurchaseDto })
  @ApiResponse({ status: 201, description: 'Purchase approved and seats marked as sold.' })
  @ApiResponse({ status: 400, description: 'Invalid request or sandbox payment details.' })
  @ApiResponse({ status: 402, description: 'Sandbox bank declined the payment.' })
  @ApiResponse({ status: 409, description: 'One or more seats are no longer available.' })
  async create(@Req() request: AuthenticatedRequest, @Body() body: CreatePurchaseDto) {
    try {
      return await this.purchases.create(request.auth!.userId, body);
    } catch (error) {
      if (error instanceof PaymentInvalidDetailsError) throw new BadRequestException(error.message);
      if (error instanceof PaymentDeclinedError) throw new HttpException(error.message, HttpStatus.PAYMENT_REQUIRED);
      if (error instanceof SeatsUnavailableError) throw new ConflictException(error.message);
      if (error instanceof ShowtimeNotFoundError || error instanceof TmdbNotFoundError) throw new NotFoundException();
      if (error instanceof TmdbRateLimitedError) throw new HttpException('TMDB rate limited.', HttpStatus.TOO_MANY_REQUESTS);
      if (error instanceof TmdbUnavailableError) throw new ServiceUnavailableException();
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'List the current user confirmed purchases' })
  @ApiResponse({ status: 200, description: 'Purchases ordered from newest to oldest.' })
  list(@Req() request: AuthenticatedRequest) {
    return this.purchases.listForUser(request.auth!.userId);
  }
}
