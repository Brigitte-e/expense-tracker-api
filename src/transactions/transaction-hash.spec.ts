import { transactionHash } from './transaction-hash';

describe('transactionHash', () => {
  const input = {
    date: new Date(2026, 7, 20, 12, 0, 0),
    amount: 45.32,
    description: 'LIDL BARCELONA',
    accountId: 'revolut-account',
  };

  it('is stable for the same date, amount, description, and account', () => {
    expect(transactionHash(input)).toBe(transactionHash({ ...input }));
  });

  it('changes when the account changes', () => {
    expect(transactionHash({ ...input, accountId: 'other-account' })).not.toBe(
      transactionHash(input),
    );
  });

  it('uses the calendar date, not the time of day', () => {
    expect(
      transactionHash({ ...input, date: new Date(2026, 7, 20, 23, 59, 59) }),
    ).toBe(transactionHash(input));
  });
});
