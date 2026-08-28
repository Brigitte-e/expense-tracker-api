import type { Bank } from '../imports/types/bank';

export const DEFAULT_ACCOUNTS: ReadonlyArray<{
  name: string;
  bank: Bank;
  currency: string;
}> = [
  { name: 'Revolut', bank: 'REVOLUT', currency: 'EUR' },
  { name: 'Monobank', bank: 'MONOBANK', currency: 'UAH' },
  { name: 'PrivatBank', bank: 'PRIVAT', currency: 'UAH' },
];
