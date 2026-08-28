import { matchCategory } from './category-rules';

describe('matchCategory', () => {
  it('maps LIDL to GROCERIES even with extra text', () => {
    expect(matchCategory('LIDL BARCELONA 123')).toBe('GROCERIES');
  });

  it('is case-insensitive', () => {
    expect(matchCategory('lidl')).toBe('GROCERIES');
  });

  it('maps restaurant keywords to RESTAURANTS', () => {
    expect(matchCategory('McDonalds')).toBe('RESTAURANTS');
  });

  it('maps shopping keywords to SHOPPING', () => {
    expect(matchCategory('ZARA')).toBe('SHOPPING');
  });

  it('maps transport keywords to TRANSPORT', () => {
    expect(matchCategory('UBER')).toBe('TRANSPORT');
  });

  it('maps salary to SALARY', () => {
    expect(matchCategory('Monthly SALARY')).toBe('SALARY');
  });

  it('returns OTHER when no rule matches', () => {
    expect(matchCategory('UNKNOWN MERCHANT')).toBe('OTHER');
  });
});
