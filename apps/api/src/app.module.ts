import { Module } from '@nestjs/common';
import { ParseModule } from './parse/parse.module';
import { PackModule } from './pack/pack.module';
import { ExportModule } from './export/export.module';
import { PresetsModule } from './presets/presets.module';

@Module({
  imports: [ParseModule, PackModule, ExportModule, PresetsModule],
})
export class AppModule {}








