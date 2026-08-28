import { BadRequestException } from '@nestjs/common';
import {
  parseTransactionFilters,
  startOfNextUtcDay,
  startOfUtcDay,
} from './parse-transaction-filters.pipe';

describe('parseTransactionFilters', () => {
  it('parses combined filters', () => {
    expect(
      parseTransactionFilters({
        category: 'GROCERIES',
        type: 'EXPENSE',
        from: '2026-08-01',
        to: '2026-08-31',
        accountId: '33333333-3333-4333-8333-333333333333',
        minAmount: '10',
        maxAmount: '100.5',
        search: 'lidl',
      }),
    ).toEqual({
      category: 'GROCERIES',
      type: 'EXPENSE',
      from: '2026-08-01',
      to: '2026-08-31',
      accountId: '33333333-3333-4333-8333-333333333333',
      minAmount: 10,
      maxAmount: 100.5,
      search: 'lidl',
    });
  });

  it('ignores empty values', () => {
    expect(parseTransactionFilters({ category: '', search: '  ' })).toEqual({});
  });

  it('rejects an unknown category', () => {
    expect(() => parseTransactionFilters({ category: 'FOOD' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects an unknown type', () => {
    expect(() => parseTransactionFilters({ type: 'SPEND' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects an inverted date range', () => {
    expect(() =>
      parseTransactionFilters({ from: '2026-08-31', to: '2026-08-01' }),
    ).toThrow(BadRequestException);
  });

  it('rejects an invalid date', () => {
    expect(() => parseTransactionFilters({ from: '2026-13-40' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects minAmount greater than maxAmount', () => {
    expect(() =>
      parseTransactionFilters({ minAmount: '50', maxAmount: '10' }),
    ).toThrow(BadRequestException);
  });
});

describe('UTC day bounds', () => {
  it('uses an exclusive end of the last day', () => {
    expect(startOfUtcDay('2026-08-01')).toBe('2026-08-01T00:00:00.000Z');
    expect(startOfNextUtcDay('2026-08-31')).toBe('2026-09-01T00:00:00.000Z');
  });
});
