import { Module } from '@nestjs/common';
import { ShowtimesModule } from '../showtimes/showtimes.module.js';
import { SeatsService } from './application/seats.service.js';
import { SeatsController } from './presentation/seats.controller.js';

@Module({
  imports: [ShowtimesModule],
  controllers: [SeatsController],
  providers: [SeatsService],
})
export class SeatsModule {}
