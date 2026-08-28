import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrivatParser } from './privat.parser';

const csv = `Transaction history for the period 28.08.2025 - 28.08.2026
Date,Category,Card,Description,Amount in card currency,Card currency,Amount in transaction currency,Transaction currency,Rest at the end of the period,Rest currency
14.07.2026 11:15:25,Transfer from my card,5363 **** **** 8393,From my card *5809,10.0,UAH,10.0,UAH,11.33,UAH
14.07.2026 11:15:24,Transfer to my card,5457 **** **** 5809,To my card *8393,-10.0,UAH,10.0,UAH,150.4,UAH
`;

describe('PrivatParser', () => {
  const parser = new PrivatParser();

  it('skips the title row and maps CSV rows to NormalizedTransaction', async () => {
    const transactions = await parser.parse(Buffer.from(csv));

    expect(transactions).toHaveLength(2);
    expect(transactions[0]).toMatchObject({
      description: 'From my card *5809',
      amount: 10,
      currency: 'UAH',
      type: 'INCOME',
      date: new Date('2026-07-14T11:15:25'),
    });
    expect(transactions[1]).toMatchObject({
      description: 'To my card *8393',
      amount: 10,
      currency: 'UAH',
      type: 'EXPENSE',
      date: new Date('2026-07-14T11:15:24'),
    });
  });

  it('parses the sample PrivatBank xlsx statement', async () => {
    const file = readFileSync(join(__dirname, '../../test-data/private.xlsx'));
    const transactions = await parser.parse(file);

    expect(transactions).toHaveLength(2);
    expect(transactions[0]).toMatchObject({
      description: 'From my card *5809',
      amount: 10,
      currency: 'UAH',
      type: 'INCOME',
    });
    expect(transactions[1]).toMatchObject({
      description: 'To my card *8393',
      amount: 10,
      currency: 'UAH',
      type: 'EXPENSE',
    });
    expect(transactions[0].date).toBeInstanceOf(Date);
  });
});
