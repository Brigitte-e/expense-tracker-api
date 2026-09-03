import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiQuery } from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { CATEGORIES } from '../categories/category-rules';
import type {
  Transaction,
  TransactionFilters,
  UpdateTransactionDto,
} from './interfaces/transaction.interface';
import {
  TRANSACTION_TYPES,
  UpdateTransactionBody,
} from './interfaces/transaction.interface';
import { ParseTransactionFiltersPipe } from './parse-transaction-filters.pipe';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiQuery({ name: 'category', enum: CATEGORIES, required: false })
  @ApiQuery({ name: 'type', enum: TRANSACTION_TYPES, required: false })
  @ApiQuery({
    name: 'from',
    type: String,
    format: 'date',
    example: '2026-01-01',
    required: false,
  })
  @ApiQuery({
    name: 'to',
    type: String,
    format: 'date',
    example: '2026-01-31',
    required: false,
  })
  @ApiQuery({ name: 'accountId', type: String, format: 'uuid', required: false })
  @ApiQuery({ name: 'minAmount', type: Number, minimum: 0, required: false })
  @ApiQuery({ name: 'maxAmount', type: Number, minimum: 0, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query(ParseTransactionFiltersPipe) filters: TransactionFilters,
  ): Promise<Transaction[]> {
    return this.transactionsService.findAll(user.id, filters);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Transaction> {
    return this.transactionsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiBody({ type: UpdateTransactionBody })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    return this.transactionsService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Transaction> {
    return this.transactionsService.remove(user.id, id);
  }
}
