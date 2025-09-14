import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { PackService } from './pack.service';
import { PackRequest, PackResult, Vehicle, DuctItem } from '../types';

@ApiTags('pack')
@Controller('pack')
export class PackController {
  constructor(private readonly packService: PackService) {}

  @Post()
  @ApiResponse({ status: 200, description: 'Packing completed successfully', type: Object })
  async pack(@Body() request: PackRequest): Promise<PackResult> {
    return this.packService.pack(request.vehicle, request.items);
  }
  
  @Post('analyze-all')
  @ApiResponse({ status: 200, description: 'All vehicles analyzed', type: Object })
  async analyzeAllVehicles(@Body() request: { items: DuctItem[], vehicles: Vehicle[] }): Promise<{
    recommendations: Array<{
      vehicle: Vehicle;
      result: PackResult;
      efficiency: number;
      cost: number;
    }>;
    bestOption: string;
    multiVehicleOptions: Array<{
      combination: Vehicle[];
      totalCost: number;
      description: string;
    }>;
  }> {
    return this.packService.analyzeAllVehicles(request.items, request.vehicles);
  }
}







