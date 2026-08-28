import { Test, TestingModule } from '@nestjs/testing';
import { TransactionType } from './interfaces/transaction.interface';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionsService],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should return hardcoded transactions', () => {
    expect(service.findAll()).toEqual([
      {
        id: '1',
        date: new Date('2026-08-20'),
        description: 'LIDL',
        amount: 45.32,
        type: TransactionType.EXPENSE,
        category: 'GROCERIES',
      },
    ]);
  });
});
