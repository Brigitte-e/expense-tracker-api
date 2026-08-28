import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';

const userId = 'user-1';

function mockModel() {
  const model = {
    where: jest.fn(),
    include: jest.fn(),
    first: jest.fn(),
    all: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };
  model.where.mockReturnValue(model);
  model.include.mockReturnValue(model);
  return model;
}

describe('CategoriesService', () => {
  let service: CategoriesService;
  const Category = mockModel();
  const CategoryRule = mockModel();

  const restaurants = {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'RESTAURANTS',
  };
  const starbucksRule = {
    id: 'rule-1',
    pattern: 'STARBUCKS',
    categoryId: restaurants.id,
    priority: 0,
    category: { name: 'RESTAURANTS' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    Category.where.mockReturnValue(Category);
    CategoryRule.where.mockReturnValue(CategoryRule);
    CategoryRule.include.mockReturnValue(CategoryRule);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              orm: {
                public: { Category, CategoryRule },
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get(CategoriesService);
  });

  it('categorizes from database rules', async () => {
    CategoryRule.all.mockResolvedValue([starbucksRule]);

    await expect(
      service.categorizeAll(userId, [
        {
          date: new Date('2026-08-20T10:00:00.000Z'),
          description: 'STARBUCKS RAMBLA',
          amount: 4.5,
          currency: 'EUR',
          type: 'EXPENSE',
        },
        {
          date: new Date('2026-08-20T11:00:00.000Z'),
          description: 'UNKNOWN CAFE',
          amount: 8,
          currency: 'EUR',
          type: 'EXPENSE',
        },
      ]),
    ).resolves.toEqual([
      expect.objectContaining({
        description: 'STARBUCKS RAMBLA',
        category: 'RESTAURANTS',
      }),
      expect.objectContaining({
        description: 'UNKNOWN CAFE',
        category: 'OTHER',
      }),
    ]);
    expect(CategoryRule.where).toHaveBeenCalledWith({ userId });
  });

  it('creates a rule from a category name', async () => {
    Category.first.mockResolvedValue(restaurants);
    CategoryRule.first.mockResolvedValue(null);
    CategoryRule.create.mockResolvedValue({
      id: starbucksRule.id,
      pattern: 'STARBUCKS',
      categoryId: restaurants.id,
      priority: 0,
    });

    await expect(
      service.createRule(userId, {
        pattern: 'starbucks',
        categoryId: 'restaurants',
        priority: 0,
      }),
    ).resolves.toEqual({
      id: starbucksRule.id,
      pattern: 'STARBUCKS',
      categoryId: restaurants.id,
      category: 'RESTAURANTS',
      priority: 0,
    });

    expect(CategoryRule.create).toHaveBeenCalledWith({
      pattern: 'STARBUCKS',
      categoryId: restaurants.id,
      priority: 0,
      userId,
    });
  });

  it('creates a rule from a category UUID', async () => {
    Category.first.mockResolvedValue(restaurants);
    CategoryRule.first.mockResolvedValue(null);
    CategoryRule.create.mockResolvedValue({
      id: starbucksRule.id,
      pattern: 'STARBUCKS',
      categoryId: restaurants.id,
      priority: 5,
    });

    await service.createRule(userId, {
      pattern: 'STARBUCKS',
      categoryId: restaurants.id,
      priority: 5,
    });

    expect(Category.where).toHaveBeenCalledWith({
      id: restaurants.id,
      userId,
    });
    expect(CategoryRule.create).toHaveBeenCalledWith({
      pattern: 'STARBUCKS',
      categoryId: restaurants.id,
      priority: 5,
      userId,
    });
  });

  it('rejects an unknown category', async () => {
    Category.first.mockResolvedValue(null);

    await expect(
      service.createRule(userId, {
        pattern: 'STARBUCKS',
        categoryId: 'coffee',
        priority: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a duplicate pattern', async () => {
    Category.first.mockResolvedValue(restaurants);
    CategoryRule.first.mockResolvedValue(starbucksRule);

    await expect(
      service.createRule(userId, {
        pattern: 'STARBUCKS',
        categoryId: 'RESTAURANTS',
        priority: 0,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists rules by priority', async () => {
    CategoryRule.all.mockResolvedValue([
      { ...starbucksRule, priority: 0 },
      {
        id: 'rule-2',
        pattern: 'UBER EATS',
        categoryId: restaurants.id,
        priority: 10,
        category: { name: 'RESTAURANTS' },
      },
    ]);

    await expect(service.findAllRules(userId)).resolves.toEqual([
      expect.objectContaining({ pattern: 'UBER EATS', priority: 10 }),
      expect.objectContaining({ pattern: 'STARBUCKS', priority: 0 }),
    ]);
  });

  it('deletes a rule', async () => {
    CategoryRule.first.mockResolvedValue(starbucksRule);

    await expect(service.removeRule(userId, starbucksRule.id)).resolves.toEqual(
      {
        id: starbucksRule.id,
        pattern: 'STARBUCKS',
        categoryId: restaurants.id,
        category: 'RESTAURANTS',
        priority: 0,
      },
    );
    expect(CategoryRule.delete).toHaveBeenCalled();
  });

  it('rejects deleting a missing rule', async () => {
    CategoryRule.first.mockResolvedValue(null);

    await expect(service.removeRule(userId, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
