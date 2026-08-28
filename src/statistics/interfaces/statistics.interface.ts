export interface StatisticsSummary {
  income: number;
  expenses: number;
  balance: number;
}

export interface CategoryStatistic {
  category: string;
  amount: number;
}

export interface MonthlyStatistic {
  month: string;
  income: number;
  expenses: number;
}
