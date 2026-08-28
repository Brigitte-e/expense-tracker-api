import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoryRulesController } from './category-rules.controller';

@Module({
  controllers: [CategoryRulesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
