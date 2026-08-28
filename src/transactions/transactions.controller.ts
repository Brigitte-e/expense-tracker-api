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
import type {
  Transaction,
  TransactionFilters,
  UpdateTransactionDto,
} from './interfaces/transaction.interface';
import { ParseTransactionFiltersPipe } from './parse-transaction-filters.pipe';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(
    @Query(ParseTransactionFiltersPipe) filters: TransactionFilters,
  ): Promise<Transaction[]> {
    return this.transactionsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Transaction> {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    return this.transactionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<Transaction> {
    return this.transactionsService.remove(id);
  }
}
