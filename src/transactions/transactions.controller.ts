import { Controller, Get } from '@nestjs/common';
import { Transaction } from './interfaces/transaction.interface';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(): Transaction[] {
    return this.transactionsService.findAll();
  }
}
