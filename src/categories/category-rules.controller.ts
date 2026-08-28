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
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
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
  findAll(@CurrentUser() user: AuthUser): Promise<CategoryRuleResponse[]> {
    return this.categoriesService.findAllRules(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthUser,
    @Body(ParseCreateCategoryRulePipe) dto: CreateCategoryRuleDto,
  ): Promise<CategoryRuleResponse> {
    return this.categoriesService.createRule(user.id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CategoryRuleResponse> {
    return this.categoriesService.removeRule(user.id, id);
  }
}
