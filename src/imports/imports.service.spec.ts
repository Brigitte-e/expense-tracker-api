import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from '../categories/categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { ImportsService } from './imports.service';
import { RevolutParser } from './parsers/revolut.parser';

const userId = 'user-1';

function mockModel() {
  const model = {
    where: jest.fn(),
    first: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  model.where.mockReturnValue(model);
  return model;
}

const csv = `Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance
Card Payment,Current,2026-08-20 10:00:00,2026-08-20 10:00:01,LIDL BARCELONA,-45.32,0.00,EUR,COMPLETED,1000.00
`;

describe('ImportsService', () => {
  let service: ImportsService;
  const Account = mockModel();
  const Import = mockModel();
  const transactionsService = {
    createFromImport: jest.fn(),
  };
  const categoriesService = {
    categorizeAll: jest.fn((id: string, transactions: unknown[]) =>
      transactions.map((transaction) => ({
        ...(transaction as object),
        category: 'GROCERIES',
      })),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    Account.where.mockReturnValue(Account);
    Import.where.mockReturnValue(Import);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportsService,
        { provide: CategoriesService, useValue: categoriesService },
        { provide: TransactionsService, useValue: transactionsService },
        {
          provide: PrismaService,
          useValue: {
            client: { orm: { public: { Account, Import } } },
          },
        },
      ],
    }).compile();

    service = module.get(ImportsService);
  });

  it('parses and categorizes a Revolut statement', async () => {
    const result = await service.parseAndCategorize(
      userId,
      Buffer.from(csv),
      new RevolutParser(),
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      description: 'LIDL BARCELONA',
      amount: 45.32,
      category: 'GROCERIES',
    });
    expect(categoriesService.categorizeAll).toHaveBeenCalledWith(
      userId,
      expect.any(Array),
    );
  });

  it('saves categorized transactions for a matching account', async () => {
    Account.first.mockResolvedValue({
      id: 'account-1',
      bank: 'REVOLUT',
    });
    Import.create.mockResolvedValue({ id: 'import-1' });
    transactionsService.createFromImport.mockResolvedValue({
      imported: 1,
      skipped: 0,
    });
    Import.update.mockResolvedValue({});

    const result = await service.importStatement({
      userId,
      file: Buffer.from(csv),
      fileName: 'statement.csv',
      bank: 'REVOLUT',
      accountId: 'account-1',
    });

    expect(result).toEqual({
      id: 'import-1',
      fileName: 'statement.csv',
      bank: 'REVOLUT',
      status: 'COMPLETED',
      imported: 1,
      skipped: 0,
      total: 1,
    });
    expect(Account.where).toHaveBeenCalledWith({
      id: 'account-1',
      userId,
    });
    expect(Import.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId }),
    );
    expect(transactionsService.createFromImport).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        accountId: 'account-1',
        importId: 'import-1',
      }),
    );
  });

  it('rejects a missing account', async () => {
    Account.first.mockResolvedValue(null);

    await expect(
      service.importStatement({
        userId,
        file: Buffer.from(csv),
        fileName: 'statement.csv',
        bank: 'REVOLUT',
        accountId: 'missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a file that does not match the selected bank', async () => {
    Account.first.mockResolvedValue({ id: 'account-1', bank: 'REVOLUT' });

    await expect(
      service.importStatement({
        userId,
        file: Buffer.from('not a statement'),
        fileName: 'statement.csv',
        bank: 'REVOLUT',
        accountId: 'account-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
