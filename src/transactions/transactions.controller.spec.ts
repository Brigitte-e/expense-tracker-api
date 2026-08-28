import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

const transaction = {
  id: '11111111-1111-4111-8111-111111111111',
  date: '2026-08-20T10:00:00.000Z',
  description: 'Amazon Prime',
  merchant: null,
  amount: 9.99,
  currency: 'EUR',
  type: 'EXPENSE' as const,
  category: 'SUBSCRIPTIONS',
  accountId: '22222222-2222-4222-8222-222222222222',
  importId: null,
  createdAt: '2026-08-20T10:00:00.000Z',
};

describe('TransactionsController', () => {
  let controller: TransactionsController;
  const transactionsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        { provide: TransactionsService, useValue: transactionsService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(TransactionsController);
    jest.clearAllMocks();
  });

  it('lists transactions', async () => {
    transactionsService.findAll.mockResolvedValue([transaction]);
    await expect(controller.findAll()).resolves.toEqual([transaction]);
  });

  it('returns one transaction', async () => {
    transactionsService.findOne.mockResolvedValue(transaction);
    await expect(controller.findOne(transaction.id)).resolves.toEqual(
      transaction,
    );
  });

  it('patches the category', async () => {
    const updated = { ...transaction, category: 'SUBSCRIPTIONS' };
    transactionsService.update.mockResolvedValue(updated);

    await expect(
      controller.update(transaction.id, { category: 'SUBSCRIPTIONS' }),
    ).resolves.toEqual(updated);
    expect(transactionsService.update).toHaveBeenCalledWith(transaction.id, {
      category: 'SUBSCRIPTIONS',
    });
  });

  it('deletes a transaction', async () => {
    transactionsService.remove.mockResolvedValue(transaction);
    await expect(controller.remove(transaction.id)).resolves.toEqual(
      transaction,
    );
  });
});
