import { BadRequestException } from '@nestjs/common';
import { parseCredentials } from './parse-credentials.pipe';

describe('parseCredentials', () => {
  it('normalizes email and keeps the password', () => {
    expect(
      parseCredentials({
        email: '  Ada@Example.COM ',
        password: 'secret12',
      }),
    ).toEqual({
      email: 'ada@example.com',
      password: 'secret12',
    });
  });

  it('rejects a missing email', () => {
    expect(() => parseCredentials({ password: 'secret12' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects an invalid email', () => {
    expect(() =>
      parseCredentials({ email: 'not-an-email', password: 'secret12' }),
    ).toThrow(BadRequestException);
  });

  it('rejects a short password', () => {
    expect(() =>
      parseCredentials({ email: 'ada@example.com', password: 'short' }),
    ).toThrow(BadRequestException);
  });
});
