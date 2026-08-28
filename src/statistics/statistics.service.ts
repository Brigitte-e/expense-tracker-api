import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CategoryStatistic,
  MonthlyStatistic,
  StatisticsSummary,
} from './interfaces/statistics.interface';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string): Promise<StatisticsSummary> {
    const [income, expenses] = await Promise.all([
      this.sumByType(userId, 'INCOME'),
      this.sumByType(userId, 'EXPENSE'),
    ]);

    return {
      income,
      expenses,
      balance: money(income - expenses),
    };
  }

  async byCategory(userId: string): Promise<CategoryStatistic[]> {
    const [grouped, categories] = await Promise.all([
      this.prisma.client.orm.public.Transaction.where({
        userId,
        type: 'EXPENSE',
      })
        .groupBy('categoryId')
        .aggregate((aggregate) => ({
          amount: aggregate.sum('amount'),
        })),
      this.prisma.client.orm.public.Category.where({ userId }).all(),
    ]);

    const names = new Map(
      categories.map((category) => [category.id, category.name]),
    );

    return grouped
      .map((row) => ({
        category: names.get(row.categoryId) ?? 'OTHER',
        amount: money(row.amount ?? 0),
      }))
      .filter((row) => row.amount > 0)
      .sort((left, right) => right.amount - left.amount);
  }

  async monthly(userId: string): Promise<MonthlyStatistic[]> {
    const rows = await this.prisma.client.orm.public.Transaction.where({
      userId,
    })
      .select('date', 'type', 'amount')
      .all();

    const byMonth = new Map<string, { income: number; expenses: number }>();

    for (const row of rows) {
      const month = row.date.slice(0, 7);
      const bucket = byMonth.get(month) ?? { income: 0, expenses: 0 };
      const amount = Number(row.amount);

      if (row.type === 'INCOME') {
        bucket.income += amount;
      } else {
        bucket.expenses += amount;
      }

      byMonth.set(month, bucket);
    }

    return [...byMonth.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([month, totals]) => ({
        month,
        income: money(totals.income),
        expenses: money(totals.expenses),
      }));
  }

  private async sumByType(
    userId: string,
    type: 'INCOME' | 'EXPENSE',
  ): Promise<number> {
    const result = await this.prisma.client.orm.public.Transaction.where({
      userId,
      type,
    }).aggregate((aggregate) => ({
      total: aggregate.sum('amount'),
    }));

    return money(result.total ?? 0);
  }
}

function money(value: unknown): number {
  return Math.round(Number(value) * 100) / 100;
}
