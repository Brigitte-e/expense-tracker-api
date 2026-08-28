import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  matchCategory,
  SEED_CATEGORY_RULES,
} from '../categories/category-rules';
import { resolveStatementParser } from './parsers/resolve-parser';
import { RevolutParser } from './parsers/revolut.parser';

const csv = `Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance
Card Payment,Current,2026-08-20 10:00:00,2026-08-20 10:00:01,LIDL BARCELONA,-45.32,0.00,EUR,COMPLETED,1000.00
Topup,Current,2026-08-21 03:00:00,2026-08-21 03:00:01,Salary,2500.00,0.00,EUR,COMPLETED,3500.00
Card Payment,Current,2026-08-22 12:00:00,2026-08-22 12:00:01,UBER,-16.50,0.00,EUR,COMPLETED,3483.50
Card Payment,Current,2026-08-23 18:00:00,2026-08-23 18:00:01,UNKNOWN CAFE,-8.00,0.00,EUR,COMPLETED,3475.50
`;

async function parseAndCategorize(file: Buffer) {
  const parser = resolveStatementParser(file);
  const transactions = await parser.parse(file);
  return transactions.map((transaction) => ({
    ...transaction,
    category: matchCategory(transaction.description, SEED_CATEGORY_RULES),
  }));
}

describe('parser + categorization pipeline', () => {
  it('turns a Revolut CSV into categorized transactions', async () => {
    const parser = new RevolutParser();
    const transactions = await parser.parse(Buffer.from(csv));
    const result = transactions.map((transaction) => ({
      ...transaction,
      category: matchCategory(transaction.description, SEED_CATEGORY_RULES),
    }));

    expect(result).toHaveLength(4);
    expect(result[0]).toMatchObject({
      description: 'LIDL BARCELONA',
      amount: 45.32,
      currency: 'EUR',
      type: 'EXPENSE',
      category: 'GROCERIES',
    });
    expect(result[1]).toMatchObject({
      description: 'Salary',
      amount: 2500,
      type: 'INCOME',
      category: 'SALARY',
    });
    expect(result[2]).toMatchObject({
      description: 'UBER',
      amount: 16.5,
      type: 'EXPENSE',
      category: 'TRANSPORT',
    });
    expect(result[3]).toMatchObject({
      description: 'UNKNOWN CAFE',
      type: 'EXPENSE',
      category: 'OTHER',
    });
    expect(result[0].date).toBeInstanceOf(Date);
  });

  it('auto-detects bank format and categorizes sample statements', async () => {
    const fixtures = join(__dirname, '../test-data');

    const revolut = await parseAndCategorize(
      readFileSync(join(fixtures, 'revolut.csv')),
    );
    const monobank = await parseAndCategorize(
      readFileSync(join(fixtures, 'monobank.csv')),
    );
    const privat = await parseAndCategorize(
      readFileSync(join(fixtures, 'private.xlsx')),
    );

    expect(revolut.length).toBeGreaterThan(900);
    expect(monobank.length).toBeGreaterThan(200);
    expect(privat).toHaveLength(2);
    expect(privat[0]).toMatchObject({
      description: 'From my card *5809',
      category: 'OTHER',
      type: 'INCOME',
    });
  });
});
