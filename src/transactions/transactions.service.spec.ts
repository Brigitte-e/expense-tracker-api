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
    groupBy: jest.fn(),
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

  it('filters by category, type, and date range', async () => {
    Category.first.mockResolvedValue({
      id: 'cat-groceries',
      name: 'GROCERIES',
    });
    Transaction.all.mockResolvedValue([]);

    const date = { gte: jest.fn(), lt: jest.fn() };
    Transaction.where.mockImplementation((arg: unknown) => {
      if (typeof arg === 'function') {
        arg({ date, amount: { gte: jest.fn(), lte: jest.fn() } });
      }
      return Transaction;
    });

    await service.findAll({
      category: 'GROCERIES',
      type: 'EXPENSE',
      from: '2026-08-01',
      to: '2026-08-31',
    });

    expect(Category.where).toHaveBeenCalledWith({ name: 'GROCERIES' });
    expect(Transaction.where).toHaveBeenCalledWith({
      categoryId: 'cat-groceries',
    });
    expect(Transaction.where).toHaveBeenCalledWith({ type: 'EXPENSE' });
    expect(date.gte).toHaveBeenCalledWith('2026-08-01T00:00:00.000Z');
    expect(date.lt).toHaveBeenCalledWith('2026-09-01T00:00:00.000Z');
  });

  it('returns nothing when the category is missing from the database', async () => {
    Category.first.mockResolvedValue(null);
    await expect(service.findAll({ category: 'GROCERIES' })).resolves.toEqual(
      [],
    );
    expect(Transaction.all).not.toHaveBeenCalled();
  });

  it('filters by account and amount range', async () => {
    Transaction.all.mockResolvedValue([]);
    const amount = { gte: jest.fn(), lte: jest.fn() };
    Transaction.where.mockImplementation((arg: unknown) => {
      if (typeof arg === 'function') {
        arg({ date: { gte: jest.fn(), lt: jest.fn() }, amount });
      }
      return Transaction;
    });

    await service.findAll({
      accountId: row.accountId,
      minAmount: 10,
      maxAmount: 50,
    });

    expect(Transaction.where).toHaveBeenCalledWith({
      accountId: row.accountId,
    });
    expect(amount.gte).toHaveBeenCalledWith('10.0000');
    expect(amount.lte).toHaveBeenCalledWith('50.0000');
  });

  it('searches description and merchant case-insensitively', async () => {
    Transaction.all.mockResolvedValue([
      row,
      {
        ...row,
        id: 'lidl-1',
        description: 'LIDL BARCELONA',
        category: { name: 'GROCERIES' },
      },
      {
        ...row,
        id: 'merchant-1',
        description: 'Card payment',
        merchant: 'Lidl Online',
        category: { name: 'GROCERIES' },
      },
    ]);

    await expect(service.findAll({ search: 'lidl' })).resolves.toEqual([
      expect.objectContaining({ id: 'lidl-1', description: 'LIDL BARCELONA' }),
      expect.objectContaining({
        id: 'merchant-1',
        merchant: 'Lidl Online',
      }),
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
