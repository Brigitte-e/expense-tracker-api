import { parse } from 'csv-parse/sync';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as XLSX from 'xlsx';
import { RevolutParser } from './revolut.parser';

const csv = `Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance
Topup,Current,2025-03-26 03:04:25,2025-03-26 03:04:28,Salary,2429.98,0.00,EUR,COMPLETED,2429.98
Card Payment,Current,2025-04-03 14:36:09,2025-04-04 09:42:36,Fontoplumo,-59.00,0.00,EUR,COMPLETED,2302.19
Card Payment,Current,2025-05-15 21:21:35,,Niza Cars,-300.00,0.00,EUR,REVERTED,
Topup,Current,2026-05-07 03:05:19,2026-05-07 03:05:21,"Payment from FIELMANN TEC, S.L",82.86,0.00,EUR,COMPLETED,22033.33
`;

describe('RevolutParser', () => {
  const parser = new RevolutParser();

  it('maps completed CSV rows to NormalizedTransaction', async () => {
    const transactions = await parser.parse(Buffer.from(csv));

    expect(transactions).toHaveLength(3);
    expect(transactions[0]).toMatchObject({
      description: 'Salary',
      amount: 2429.98,
      currency: 'EUR',
      type: 'INCOME',
      date: new Date('2025-03-26T03:04:28'),
    });
    expect(transactions[1]).toMatchObject({
      description: 'Fontoplumo',
      amount: 59,
      currency: 'EUR',
      type: 'EXPENSE',
      date: new Date('2025-04-04T09:42:36'),
    });
    expect(transactions[2]).toMatchObject({
      description: 'Payment from FIELMANN TEC, S.L',
      amount: 82.86,
      currency: 'EUR',
      type: 'INCOME',
    });
  });

  it('does not assign a category', async () => {
    const transactions = await parser.parse(Buffer.from(csv));

    expect(transactions[0]).not.toHaveProperty('category');
  });

  it('parses the same rows from xlsx', async () => {
    const rows = parse(csv, {
      relax_column_count: true,
      skip_empty_lines: true,
    }) as string[][];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(rows),
      'Sheet1',
    );
    const file = Buffer.from(
      XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
    );

    const transactions = await parser.parse(file);

    expect(transactions).toHaveLength(3);
    expect(transactions[0]).toMatchObject({
      description: 'Salary',
      amount: 2429.98,
      currency: 'EUR',
      type: 'INCOME',
    });
  });

  it('parses the sample Revolut statement', async () => {
    const file = readFileSync(join(__dirname, '../../test-data/revolut.csv'));
    const transactions = await parser.parse(file);

    expect(transactions.length).toBeGreaterThan(900);
    expect(
      transactions.every(
        (transaction) =>
          transaction.amount > 0 &&
          (transaction.type === 'INCOME' || transaction.type === 'EXPENSE') &&
          transaction.currency.length > 0,
      ),
    ).toBe(true);
  });
});
