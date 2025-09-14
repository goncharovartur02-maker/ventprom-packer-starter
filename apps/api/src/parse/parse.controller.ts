import { Controller, Post, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { ParseService } from './parse.service';
import { UniversalItem } from '../types';

@ApiTags('parse')
@Controller('parse')
export class ParseController {
  constructor(private readonly parseService: ParseService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Files parsed successfully' })
  async parseFiles(@UploadedFiles() files: Express.Multer.File[]): Promise<{ items: UniversalItem[] }> {
    const items = await this.parseService.parseFilesUniversal(files);
    return { items };
  }
}







