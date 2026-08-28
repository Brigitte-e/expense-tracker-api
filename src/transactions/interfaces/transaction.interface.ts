export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: TransactionType;
  category?: string;
}
