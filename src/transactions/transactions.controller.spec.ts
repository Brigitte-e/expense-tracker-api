import { Test, TestingModule } from '@nestjs/testing';
import { TransactionType } from './interfaces/transaction.interface';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [TransactionsService],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  it('should return hardcoded transactions', () => {
    expect(controller.findAll()).toEqual([
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
