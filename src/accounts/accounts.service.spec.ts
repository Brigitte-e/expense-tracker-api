import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

const user = { id: 'user-1', email: 'a@b.c' };
const account = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Revolut',
  bank: 'REVOLUT' as const,
  currency: 'EUR',
  createdAt: '2026-08-28T10:00:00.000Z',
};

describe('AccountsService', () => {
  let service: AccountsService;
  const Account = {
    where: jest.fn(),
    all: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    Account.where.mockReturnValue(Account);
    Account.all.mockResolvedValue([account]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: PrismaService,
          useValue: {
            client: { orm: { public: { Account } } },
          },
        },
      ],
    }).compile();

    service = module.get(AccountsService);
  });

  it('lists accounts for the current user', async () => {
    await expect(service.findAll(user.id)).resolves.toEqual([account]);
    expect(Account.where).toHaveBeenCalledWith({ userId: user.id });
  });
});

describe('AccountsController', () => {
  let controller: AccountsController;
  const accountsService = { findAll: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [{ provide: AccountsService, useValue: accountsService }],
    }).compile();

    controller = module.get(AccountsController);
    jest.clearAllMocks();
  });

  it('lists accounts', async () => {
    accountsService.findAll.mockResolvedValue([account]);
    await expect(controller.findAll(user)).resolves.toEqual([account]);
    expect(accountsService.findAll).toHaveBeenCalledWith(user.id);
  });
});
