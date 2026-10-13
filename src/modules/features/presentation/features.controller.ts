import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FeaturesService } from '../application/features.service.js';

@ApiTags('Application features')
@Controller('app/features')
export class FeaturesController {
  constructor(private readonly features: FeaturesService) {}

  @Get()
  @ApiOperation({ summary: 'List the application feature catalogue' })
  @ApiResponse({ status: 200, description: 'Feature catalogue and feature availability.' })
  list() {
    return this.features.list();
  }
}
