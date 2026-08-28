import { Controller, Get } from '@nestjs/common';
import type {
  CategoryStatistic,
  MonthlyStatistic,
  StatisticsSummary,
} from './interfaces/statistics.interface';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('summary')
  summary(): Promise<StatisticsSummary> {
    return this.statisticsService.summary();
  }

  @Get('by-category')
  byCategory(): Promise<CategoryStatistic[]> {
    return this.statisticsService.byCategory();
  }

  @Get('monthly')
  monthly(): Promise<MonthlyStatistic[]> {
    return this.statisticsService.monthly();
  }
}
