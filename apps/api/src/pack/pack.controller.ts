import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { PackService } from './pack.service';
import { PackRequest, PackResult, Vehicle, DuctItem } from '@ventprom/core';

@ApiTags('pack')
@Controller('pack')
export class PackController {
  constructor(private readonly packService: PackService) {}

  @Post()
  @ApiResponse({ status: 200, description: 'Packing completed successfully', type: Object })
  async pack(@Body() request: PackRequest): Promise<PackResult> {
    return this.packService.pack(request.vehicle, request.items);
  }
}






