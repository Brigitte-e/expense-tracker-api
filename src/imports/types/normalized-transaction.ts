export type TransactionType = 'INCOME' | 'EXPENSE';

export interface NormalizedTransaction {
  date: Date;
  description: string;
  merchant?: string;
  amount: number;
  currency: string;
  type: TransactionType;
}
