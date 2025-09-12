import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { PresetsService } from './presets.service';
import { Vehicle } from '@ventprom/core';

@ApiTags('presets')
@Controller('presets')
export class PresetsController {
  constructor(private readonly presetsService: PresetsService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Vehicle presets retrieved successfully', type: [Vehicle] })
  async getPresets(): Promise<Vehicle[]> {
    return this.presetsService.getPresets();
  }
}




