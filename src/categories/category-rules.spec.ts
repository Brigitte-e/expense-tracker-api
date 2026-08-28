import { matchCategory, SEED_CATEGORY_RULES } from './category-rules';

describe('matchCategory', () => {
  it('maps LIDL to GROCERIES even with extra text', () => {
    expect(matchCategory('LIDL BARCELONA 123', SEED_CATEGORY_RULES)).toBe(
      'GROCERIES',
    );
  });

  it('is case-insensitive', () => {
    expect(matchCategory('lidl', SEED_CATEGORY_RULES)).toBe('GROCERIES');
  });

  it('maps restaurant keywords to RESTAURANTS', () => {
    expect(matchCategory('McDonalds', SEED_CATEGORY_RULES)).toBe('RESTAURANTS');
  });

  it('maps shopping keywords to SHOPPING', () => {
    expect(matchCategory('ZARA', SEED_CATEGORY_RULES)).toBe('SHOPPING');
  });

  it('maps transport keywords to TRANSPORT', () => {
    expect(matchCategory('UBER', SEED_CATEGORY_RULES)).toBe('TRANSPORT');
  });

  it('maps salary to SALARY', () => {
    expect(matchCategory('Monthly SALARY', SEED_CATEGORY_RULES)).toBe('SALARY');
  });

  it('maps NETFLIX to SUBSCRIPTIONS', () => {
    expect(matchCategory('Netflix', SEED_CATEGORY_RULES)).toBe('SUBSCRIPTIONS');
  });

  it('returns OTHER when no rule matches', () => {
    expect(matchCategory('UNKNOWN MERCHANT', SEED_CATEGORY_RULES)).toBe(
      'OTHER',
    );
  });

  it('prefers the higher-priority rule when several match', () => {
    expect(
      matchCategory('UBER EATS BARCELONA', [
        { pattern: 'UBER', category: 'TRANSPORT', priority: 0 },
        { pattern: 'UBER EATS', category: 'RESTAURANTS', priority: 10 },
      ]),
    ).toBe('RESTAURANTS');
  });
});
