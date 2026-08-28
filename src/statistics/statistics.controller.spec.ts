import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

describe('StatisticsController', () => {
  let controller: StatisticsController;
  const statisticsService = {
    summary: jest.fn(),
    byCategory: jest.fn(),
    monthly: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatisticsController],
      providers: [
        { provide: StatisticsService, useValue: statisticsService },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get(StatisticsController);
    jest.clearAllMocks();
  });

  it('returns the summary', async () => {
    const summary = { income: 3200, expenses: 2150, balance: 1050 };
    statisticsService.summary.mockResolvedValue(summary);
    await expect(controller.summary()).resolves.toEqual(summary);
  });

  it('returns totals by category', async () => {
    const rows = [{ category: 'GROCERIES', amount: 450 }];
    statisticsService.byCategory.mockResolvedValue(rows);
    await expect(controller.byCategory()).resolves.toEqual(rows);
  });

  it('returns monthly totals', async () => {
    const rows = [{ month: '2026-06', income: 3000, expenses: 1900 }];
    statisticsService.monthly.mockResolvedValue(rows);
    await expect(controller.monthly()).resolves.toEqual(rows);
  });
});
