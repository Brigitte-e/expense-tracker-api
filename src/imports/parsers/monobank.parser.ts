import { NormalizedTransaction } from '../types/normalized-transaction';
import { StatementParser } from './statement-parser.interface';
import {
  hasHeaders,
  mapSpreadsheet,
  parseAmount,
  parseDate,
  toSignedTransaction,
} from './spreadsheet';

const CARD_AMOUNT_PREFIX = 'Card currency amount';
const CARD_CURRENCY = /\(([A-Za-z]{3})\)/;

export class MonobankParser implements StatementParser {
  static readonly requiredHeaders = [
    'Date and time',
    'Description',
    'MCC',
    (header: string) => header.startsWith(CARD_AMOUNT_PREFIX),
  ];

  matches(rows: string[][]): boolean {
    return hasHeaders(rows, MonobankParser.requiredHeaders);
  }

  async parse(file: Buffer): Promise<NormalizedTransaction[]> {
    return mapSpreadsheet(file, MonobankParser.requiredHeaders, (row) =>
      this.toNormalizedTransaction(row),
    );
  }

  private toNormalizedTransaction(
    row: Record<string, string>,
  ): NormalizedTransaction | null {
    const date = parseDate(row['Date and time'] ?? '');
    const cardAmount = this.cardAmount(row);
    if (!date || !cardAmount) {
      return null;
    }

    return toSignedTransaction(
      date,
      row.Description,
      parseAmount(cardAmount.value),
      cardAmount.currency,
    );
  }

  private cardAmount(
    row: Record<string, string>,
  ): { value: string; currency: string } | null {
    const header = Object.keys(row).find((key) =>
      key.startsWith(CARD_AMOUNT_PREFIX),
    );
    const currency = header
      ? CARD_CURRENCY.exec(header)?.[1]?.toUpperCase()
      : undefined;
    if (!header || !currency) {
      return null;
    }

    return { value: row[header], currency };
  }
}
