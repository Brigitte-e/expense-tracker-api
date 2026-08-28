import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CATEGORIES, SEED_CATEGORY_RULES } from '../categories/category-rules';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_ACCOUNTS } from './user-defaults';
import { UsersService } from './users.service';

function mockModel() {
  const model = {
    where: jest.fn(),
    first: jest.fn(),
    all: jest.fn(),
    create: jest.fn(),
    createAll: jest.fn(),
  };
  model.where.mockReturnValue(model);
  return model;
}

describe('UsersService', () => {
  let service: UsersService;
  const User = mockModel();
  const Category = mockModel();
  const CategoryRule = mockModel();
  const Account = mockModel();

  beforeEach(async () => {
    jest.clearAllMocks();
    User.where.mockReturnValue(User);
    Category.where.mockReturnValue(Category);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              orm: {
                public: { User, Category, CategoryRule, Account },
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('creates a user', async () => {
    const row = {
      id: 'user-1',
      email: 'ada@example.com',
      passwordHash: 'hash',
      createdAt: '2026-08-28T10:00:00.000Z',
    };
    User.create.mockResolvedValue(row);

    await expect(service.create(row.email, 'hash')).resolves.toEqual(row);
    expect(User.create).toHaveBeenCalledWith({
      email: row.email,
      passwordHash: 'hash',
    });
  });

  it('rejects a duplicate email', async () => {
    User.create.mockRejectedValue({ code: '23505' });
    await expect(
      service.create('ada@example.com', 'hash'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('provisions default categories, rules, and accounts', async () => {
    Category.createAll.mockResolvedValue([]);
    Category.all.mockResolvedValue(
      CATEGORIES.map((name, index) => ({
        id: `cat-${index}`,
        name,
      })),
    );
    CategoryRule.createAll.mockResolvedValue([]);
    Account.createAll.mockResolvedValue([]);

    await service.provisionDefaults('user-1');

    expect(Category.createAll).toHaveBeenCalledWith(
      CATEGORIES.map((name) => ({ name, userId: 'user-1' })),
    );
    expect(CategoryRule.createAll).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          pattern: SEED_CATEGORY_RULES[0].pattern,
          userId: 'user-1',
        }),
      ]),
    );
    expect(Account.createAll).toHaveBeenCalledWith(
      DEFAULT_ACCOUNTS.map((account) => ({ ...account, userId: 'user-1' })),
    );
  });
});
