import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module.js';
import { MoviesModule } from '../movies/movies.module.js';
import { SeatsModule } from '../seats/seats.module.js';
import { ShowtimesModule } from '../showtimes/showtimes.module.js';
import { PaymentSandboxService } from './application/payment-sandbox.service.js';
import { PurchasesService } from './application/purchases.service.js';
import { PurchasesController } from './presentation/purchases.controller.js';

@Module({
  imports: [PrismaModule, MoviesModule, ShowtimesModule, SeatsModule],
  controllers: [PurchasesController],
  providers: [PurchasesService, PaymentSandboxService],
})
export class PurchasesModule {}
