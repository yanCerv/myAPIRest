import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module.js';
import { ShowtimesModule } from '../showtimes/showtimes.module.js';
import { SeatsService } from './application/seats.service.js';
import { SeatsController } from './presentation/seats.controller.js';

@Module({
  imports: [ShowtimesModule, PrismaModule],
  controllers: [SeatsController],
  providers: [SeatsService],
  exports: [SeatsService],
})
export class SeatsModule {}
