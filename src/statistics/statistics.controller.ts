import { Controller, Get } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
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
  summary(@CurrentUser() user: AuthUser): Promise<StatisticsSummary> {
    return this.statisticsService.summary(user.id);
  }

  @Get('by-category')
  byCategory(@CurrentUser() user: AuthUser): Promise<CategoryStatistic[]> {
    return this.statisticsService.byCategory(user.id);
  }

  @Get('monthly')
  monthly(@CurrentUser() user: AuthUser): Promise<MonthlyStatistic[]> {
    return this.statisticsService.monthly(user.id);
  }
}
