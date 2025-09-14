import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class HealthController {
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ventprom-api',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      env: process.env.NODE_ENV || 'development'
    };
  }

  @Get('status')
  getStatus() {
    return {
      api: 'running',
      parsers: 'ready',
      packer: 'ready',
      database: 'n/a'
    };
  }
}
