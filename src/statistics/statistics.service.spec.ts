import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { StatisticsService } from './statistics.service';

function mockModel() {
  const model = {
    where: jest.fn(),
    groupBy: jest.fn(),
    select: jest.fn(),
    aggregate: jest.fn(),
    all: jest.fn(),
  };
  model.where.mockReturnValue(model);
  model.groupBy.mockReturnValue(model);
  model.select.mockReturnValue(model);
  return model;
}

describe('StatisticsService', () => {
  let service: StatisticsService;
  const Transaction = mockModel();
  const Category = mockModel();

  beforeEach(async () => {
    jest.clearAllMocks();
    Transaction.where.mockReturnValue(Transaction);
    Transaction.groupBy.mockReturnValue(Transaction);
    Transaction.select.mockReturnValue(Transaction);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              orm: {
                public: { Transaction, Category },
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get(StatisticsService);
  });

  it('summarises income, expenses, and balance', async () => {
    Transaction.aggregate
      .mockResolvedValueOnce({ total: '3200.0000' })
      .mockResolvedValueOnce({ total: '2150.0000' });

    await expect(service.summary()).resolves.toEqual({
      income: 3200,
      expenses: 2150,
      balance: 1050,
    });
  });

  it('groups expenses by category', async () => {
    Transaction.aggregate.mockResolvedValue([
      { categoryId: 'cat-groceries', amount: '450.0000' },
      { categoryId: 'cat-shopping', amount: '310.0000' },
      { categoryId: 'cat-restaurants', amount: '220.0000' },
    ]);
    Category.all.mockResolvedValue([
      { id: 'cat-groceries', name: 'GROCERIES' },
      { id: 'cat-restaurants', name: 'RESTAURANTS' },
      { id: 'cat-shopping', name: 'SHOPPING' },
    ]);

    await expect(service.byCategory()).resolves.toEqual([
      { category: 'GROCERIES', amount: 450 },
      { category: 'SHOPPING', amount: 310 },
      { category: 'RESTAURANTS', amount: 220 },
    ]);
  });

  it('groups income and expenses by month', async () => {
    Transaction.all.mockResolvedValue([
      { date: '2026-06-10T12:00:00.000Z', type: 'INCOME', amount: '3000.0000' },
      {
        date: '2026-06-20T12:00:00.000Z',
        type: 'EXPENSE',
        amount: '1900.0000',
      },
      { date: '2026-07-05T12:00:00.000Z', type: 'INCOME', amount: '3100.0000' },
      {
        date: '2026-07-18T12:00:00.000Z',
        type: 'EXPENSE',
        amount: '2200.0000',
      },
    ]);

    await expect(service.monthly()).resolves.toEqual([
      { month: '2026-06', income: 3000, expenses: 1900 },
      { month: '2026-07', income: 3100, expenses: 2200 },
    ]);
  });
});
