import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MonobankParser } from './monobank.parser';

const csv = `"Date and time",Description,MCC,"Card currency amount, (UAH)","Operation amount","Operation currency","Exchange rate","Commission, (UAH)","Cashback amount, (UAH)",Balance
"28.08.2026 00:01:01",Google,5817,-45.0,-45.0,UAH,—,—,—,400951.2
"18.08.2026 11:26:33","From: Khomiak Vadym",6012,6500.0,6500.0,UAH,—,—,—,406051.88
"21.08.2026 15:48:01","Orange Flex",4814,-425.89,-35.0,PLN,12.1682,—,—,398774.2
`;

describe('MonobankParser', () => {
  const parser = new MonobankParser();

  it('maps CSV rows to NormalizedTransaction using card currency', async () => {
    const transactions = await parser.parse(Buffer.from(csv));

    expect(transactions).toHaveLength(3);
    expect(transactions[0]).toMatchObject({
      description: 'Google',
      amount: 45,
      currency: 'UAH',
      type: 'EXPENSE',
      date: new Date('2026-08-28T00:01:01'),
    });
    expect(transactions[1]).toMatchObject({
      description: 'From: Khomiak Vadym',
      amount: 6500,
      currency: 'UAH',
      type: 'INCOME',
    });
    expect(transactions[2]).toMatchObject({
      description: 'Orange Flex',
      amount: 425.89,
      currency: 'UAH',
      type: 'EXPENSE',
    });
  });

  it('reads card currency from the amount header', async () => {
    const eurCsv = `"Date and time",Description,MCC,"Card currency amount, (EUR)","Operation amount","Operation currency","Exchange rate","Commission, (EUR)","Cashback amount, (EUR)",Balance
"28.08.2026 00:01:01",Google,5817,-12.5,-12.5,EUR,—,—,—,1000.0
"18.08.2026 11:26:33","From: Khomiak Vadym",6012,80.0,80.0,EUR,—,—,—,1080.0
`;
    const transactions = await parser.parse(Buffer.from(eurCsv));

    expect(transactions).toHaveLength(2);
    expect(transactions[0]).toMatchObject({
      description: 'Google',
      amount: 12.5,
      currency: 'EUR',
      type: 'EXPENSE',
    });
    expect(transactions[1]).toMatchObject({
      currency: 'EUR',
      type: 'INCOME',
    });
  });

  it('parses the sample Monobank statement', async () => {
    const file = readFileSync(join(__dirname, '../../test-data/monobank.csv'));
    const transactions = await parser.parse(file);

    expect(transactions.length).toBeGreaterThan(200);
    expect(
      transactions.every(
        (transaction) =>
          transaction.amount > 0 &&
          (transaction.type === 'INCOME' || transaction.type === 'EXPENSE') &&
          transaction.currency === 'UAH',
      ),
    ).toBe(true);
  });
});
