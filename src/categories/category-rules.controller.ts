import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import type {
  CategoryRuleResponse,
  CreateCategoryRuleDto,
} from './category-rules';
import { ParseCreateCategoryRulePipe } from './parse-create-category-rule.pipe';

@Controller('category-rules')
export class CategoryRulesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(): Promise<CategoryRuleResponse[]> {
    return this.categoriesService.findAllRules();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(ParseCreateCategoryRulePipe) dto: CreateCategoryRuleDto,
  ): Promise<CategoryRuleResponse> {
    return this.categoriesService.createRule(dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CategoryRuleResponse> {
    return this.categoriesService.removeRule(id);
  }
}
