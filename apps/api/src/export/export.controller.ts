import { Controller, Post, Body, Res } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService } from './export.service';
import { PackResult } from '../types';

@ApiTags('export')
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('pdf')
  @ApiResponse({ status: 200, description: 'PDF exported successfully' })
  async exportPdf(
    @Body() body: { packResult: PackResult; companyMeta?: { title: string; logoBase64: string } },
    @Res() res: Response,
  ) {
    const pdf = await this.exportService.exportPdf(body.packResult, body.companyMeta);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="packing-report.pdf"');
    res.send(pdf);
  }

  @Post('glb')
  @ApiResponse({ status: 200, description: 'GLB exported successfully' })
  async exportGlb(@Body() body: { packResult: PackResult }, @Res() res: Response) {
    const glb = await this.exportService.exportGlb(body.packResult);
    res.setHeader('Content-Type', 'model/glb');
    res.setHeader('Content-Disposition', 'attachment; filename="packing-model.glb"');
    res.send(glb);
  }

  @Post('html')
  @ApiResponse({ status: 200, description: 'HTML exported successfully' })
  async exportHtml(@Body() body: { packResult: PackResult }, @Res() res: Response) {
    const html = await this.exportService.exportHtml(body.packResult);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename="packing-viewer.html"');
    res.send(html);
  }
}







