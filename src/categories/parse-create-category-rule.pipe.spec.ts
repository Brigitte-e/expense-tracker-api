import { BadRequestException } from '@nestjs/common';
import { parseCreateCategoryRule } from './parse-create-category-rule.pipe';

describe('parseCreateCategoryRule', () => {
  it('parses pattern and category name', () => {
    expect(
      parseCreateCategoryRule({
        pattern: 'STARBUCKS',
        categoryId: 'restaurants',
      }),
    ).toEqual({
      pattern: 'STARBUCKS',
      categoryId: 'restaurants',
      priority: 0,
    });
  });

  it('parses an explicit priority', () => {
    expect(
      parseCreateCategoryRule({
        pattern: 'UBER EATS',
        categoryId: 'RESTAURANTS',
        priority: 10,
      }),
    ).toMatchObject({ priority: 10 });
  });

  it('rejects a missing pattern', () => {
    expect(() => parseCreateCategoryRule({ categoryId: 'GROCERIES' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects a non-integer priority', () => {
    expect(() =>
      parseCreateCategoryRule({
        pattern: 'LIDL',
        categoryId: 'GROCERIES',
        priority: 1.5,
      }),
    ).toThrow(BadRequestException);
  });
});
