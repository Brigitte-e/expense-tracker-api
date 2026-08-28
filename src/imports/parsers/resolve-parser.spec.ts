import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MonobankParser } from './monobank.parser';
import { PrivatParser } from './privat.parser';
import { resolveStatementParser } from './resolve-parser';
import { RevolutParser } from './revolut.parser';

const fixtures = join(__dirname, '../../test-data');

describe('resolveStatementParser', () => {
  it('detects Revolut CSV', () => {
    const file = readFileSync(join(fixtures, 'revolut.csv'));
    expect(resolveStatementParser(file)).toBeInstanceOf(RevolutParser);
  });

  it('detects Monobank CSV', () => {
    const file = readFileSync(join(fixtures, 'monobank.csv'));
    expect(resolveStatementParser(file)).toBeInstanceOf(MonobankParser);
  });

  it('detects PrivatBank xlsx', () => {
    const file = readFileSync(join(fixtures, 'private.xlsx'));
    expect(resolveStatementParser(file)).toBeInstanceOf(PrivatParser);
  });

  it('throws for an unknown format', () => {
    expect(() =>
      resolveStatementParser(Buffer.from('not a statement')),
    ).toThrow('Unsupported bank statement format');
  });
});
