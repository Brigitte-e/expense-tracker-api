import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from './transactions.service';

function mockModel() {
  const model = {
    where: jest.fn(),
    include: jest.fn(),
    orderBy: jest.fn(),
    select: jest.fn(),
    first: jest.fn(),
    all: jest.fn(),
    create: jest.fn(),
    createAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  model.where.mockReturnValue(model);
  model.include.mockReturnValue(model);
  model.orderBy.mockReturnValue(model);
  model.select.mockReturnValue(model);
  return model;
}

describe('TransactionsService', () => {
  let service: TransactionsService;
  const Transaction = mockModel();
  const Category = mockModel();

  const row = {
    id: '11111111-1111-4111-8111-111111111111',
    date: '2026-08-20T10:00:00.000Z',
    description: 'Amazon',
    merchant: null,
    amount: '12.9900',
    currency: 'EUR',
    type: 'EXPENSE' as const,
    accountId: '22222222-2222-4222-8222-222222222222',
    importId: null,
    createdAt: '2026-08-20T10:00:00.000Z',
    category: { name: 'SHOPPING' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    Transaction.where.mockReturnValue(Transaction);
    Transaction.include.mockReturnValue(Transaction);
    Transaction.orderBy.mockReturnValue(Transaction);
    Transaction.select.mockReturnValue(Transaction);
    Category.where.mockReturnValue(Category);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
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

    service = module.get(TransactionsService);
  });

  it('maps listed transactions to API responses', async () => {
    Transaction.all.mockResolvedValue([row]);

    await expect(service.findAll()).resolves.toEqual([
      {
        id: row.id,
        date: row.date,
        description: 'Amazon',
        merchant: null,
        amount: 12.99,
        currency: 'EUR',
        type: 'EXPENSE',
        category: 'SHOPPING',
        accountId: row.accountId,
        importId: null,
        createdAt: row.createdAt,
      },
    ]);
  });

  it('throws when a transaction is missing', async () => {
    Transaction.first.mockResolvedValue(null);
    await expect(service.findOne(row.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates the category', async () => {
    Transaction.first.mockResolvedValueOnce(row).mockResolvedValueOnce({
      ...row,
      category: { name: 'SUBSCRIPTIONS' },
    });
    Category.first.mockResolvedValue({
      id: 'cat-subscriptions',
      name: 'SUBSCRIPTIONS',
    });
    Transaction.update.mockResolvedValue({});

    await expect(
      service.update(row.id, { category: 'SUBSCRIPTIONS' }),
    ).resolves.toMatchObject({ category: 'SUBSCRIPTIONS' });
    expect(Transaction.update).toHaveBeenCalledWith({
      categoryId: 'cat-subscriptions',
    });
  });

  it('rejects an unknown category', async () => {
    Transaction.first.mockResolvedValue(row);
    Category.first.mockResolvedValue(null);

    await expect(
      service.update(row.id, { category: 'NOT_A_CATEGORY' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('skips duplicate hashes when importing', async () => {
    Category.all.mockResolvedValue([
      { id: 'cat-groceries', name: 'GROCERIES' },
    ]);
    Transaction.all.mockResolvedValue([]);
    Transaction.createAll.mockResolvedValue([]);

    const transaction = {
      date: new Date(2026, 7, 20, 12, 0, 0),
      description: 'LIDL BARCELONA',
      amount: 45.32,
      currency: 'EUR',
      type: 'EXPENSE' as const,
      category: 'GROCERIES' as const,
    };

    const first = await service.createFromImport({
      accountId: 'revolut-account',
      importId: 'import-1',
      transactions: [transaction],
    });
    expect(first.imported).toBe(1);
    expect(Transaction.createAll).toHaveBeenCalledTimes(1);

    const hash = Transaction.createAll.mock.calls[0][0][0]
      .transactionHash as string;
    Transaction.all.mockResolvedValue([{ transactionHash: hash }]);

    const second = await service.createFromImport({
      accountId: 'revolut-account',
      importId: 'import-2',
      transactions: [transaction],
    });
    expect(second).toEqual({ imported: 0, skipped: 1 });
    expect(Transaction.createAll).toHaveBeenCalledTimes(1);
  });
});
