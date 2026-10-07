import { Module } from '@nestjs/common';
import { ShowtimesService } from './application/showtimes.service.js';
import { ShowtimesController } from './presentation/showtimes.controller.js';

@Module({
  controllers: [ShowtimesController],
  providers: [ShowtimesService],
  exports: [ShowtimesService],
})
export class ShowtimesModule {}
