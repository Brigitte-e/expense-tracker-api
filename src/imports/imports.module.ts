import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { ImportsService } from './imports.service';

@Module({
  imports: [CategoriesModule],
  providers: [ImportsService],
  exports: [ImportsService],
})
export class ImportsModule {}
