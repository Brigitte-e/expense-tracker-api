import { MonobankParser } from './monobank.parser';
import { PrivatParser } from './privat.parser';
import { RevolutParser } from './revolut.parser';
import { StatementParser } from './statement-parser.interface';
import { readSpreadsheet } from './spreadsheet';

const PARSERS: StatementParser[] = [
  new RevolutParser(),
  new MonobankParser(),
  new PrivatParser(),
];

export function resolveStatementParser(file: Buffer): StatementParser {
  const rows = readSpreadsheet(file);

  const parser = PARSERS.find((candidate) => candidate.matches(rows));
  if (!parser) {
    throw new Error('Unsupported bank statement format');
  }

  return parser;
}
