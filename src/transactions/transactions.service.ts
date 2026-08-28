import { Injectable } from '@nestjs/common';
import {
  Transaction,
  TransactionType,
} from './interfaces/transaction.interface';

@Injectable()
export class TransactionsService {
  findAll(): Transaction[] {
    return [
      {
        id: '1',
        date: new Date('2026-08-20'),
        description: 'LIDL',
        amount: 45.32,
        type: TransactionType.EXPENSE,
        category: 'GROCERIES',
      },
    ];
  }
}
