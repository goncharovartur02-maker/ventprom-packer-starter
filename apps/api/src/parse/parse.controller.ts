import { Controller, Post, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { ParseService } from './parse.service';
import { DuctItem } from '@ventprom/core';

@ApiTags('parse')
@Controller('parse')
export class ParseController {
  constructor(private readonly parseService: ParseService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Files parsed successfully', type: [DuctItem] })
  async parseFiles(@UploadedFiles() files: Express.Multer.File[]): Promise<{ items: DuctItem[] }> {
    const items = await this.parseService.parseFiles(files);
    return { items };
  }
}




