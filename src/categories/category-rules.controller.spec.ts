import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';
import { CategoryRulesController } from './category-rules.controller';

const rule = {
  id: '11111111-1111-4111-8111-111111111111',
  pattern: 'STARBUCKS',
  categoryId: '22222222-2222-4222-8222-222222222222',
  category: 'RESTAURANTS',
  priority: 0,
};

describe('CategoryRulesController', () => {
  let controller: CategoryRulesController;
  const categoriesService = {
    findAllRules: jest.fn(),
    createRule: jest.fn(),
    removeRule: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryRulesController],
      providers: [
        { provide: CategoriesService, useValue: categoriesService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(CategoryRulesController);
    jest.clearAllMocks();
  });

  it('lists rules', async () => {
    categoriesService.findAllRules.mockResolvedValue([rule]);
    await expect(controller.findAll()).resolves.toEqual([rule]);
  });

  it('creates a rule', async () => {
    categoriesService.createRule.mockResolvedValue(rule);
    const dto = {
      pattern: 'STARBUCKS',
      categoryId: 'restaurants',
      priority: 0,
    };

    await expect(controller.create(dto)).resolves.toEqual(rule);
    expect(categoriesService.createRule).toHaveBeenCalledWith(dto);
  });

  it('deletes a rule', async () => {
    categoriesService.removeRule.mockResolvedValue(rule);
    await expect(controller.remove(rule.id)).resolves.toEqual(rule);
  });
});
