import { Bank } from '../types/bank';
import { MonobankParser } from './monobank.parser';
import { PrivatParser } from './privat.parser';
import { RevolutParser } from './revolut.parser';
import { StatementParser } from './statement-parser.interface';
import { readSpreadsheet } from './spreadsheet';

const PARSERS_BY_BANK: Record<Bank, StatementParser> = {
  REVOLUT: new RevolutParser(),
  MONOBANK: new MonobankParser(),
  PRIVAT: new PrivatParser(),
};

const PARSERS = Object.values(PARSERS_BY_BANK);

export function parserForBank(bank: Bank): StatementParser {
  return PARSERS_BY_BANK[bank];
}

export function resolveStatementParser(file: Buffer): StatementParser {
  const rows = readSpreadsheet(file);

  const parser = PARSERS.find((candidate) => candidate.matches(rows));
  if (!parser) {
    throw new Error('Unsupported bank statement format');
  }

  return parser;
}
