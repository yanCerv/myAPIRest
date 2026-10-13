import { Module } from '@nestjs/common';
import { FeaturesService } from './application/features.service.js';
import { FeaturesController } from './presentation/features.controller.js';

@Module({
  controllers: [FeaturesController],
  providers: [FeaturesService],
})
export class FeaturesModule {}
