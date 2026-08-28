import type { Category } from '../../categories/category-rules';

export const TRANSACTION_TYPES = ['INCOME', 'EXPENSE'] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export function isTransactionType(value: unknown): value is TransactionType {
  return (
    typeof value === 'string' &&
    (TRANSACTION_TYPES as readonly string[]).includes(value)
  );
}

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

export interface TransactionFilters {
  category?: Category;
  type?: TransactionType;
  from?: string;
  to?: string;
  accountId?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}
