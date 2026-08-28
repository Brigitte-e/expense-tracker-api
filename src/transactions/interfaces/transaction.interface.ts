export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  merchant: string | null;
  amount: number;
  currency: string;
  type: TransactionType;
  category: string;
  accountId: string;
  importId: string | null;
  createdAt: string;
}

export interface UpdateTransactionDto {
  category?: string;
}
