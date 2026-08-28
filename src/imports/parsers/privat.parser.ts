import { NormalizedTransaction } from '../types/normalized-transaction';
import { StatementParser } from './statement-parser.interface';
import {
  hasHeaders,
  mapSpreadsheet,
  parseAmount,
  parseDate,
  toSignedTransaction,
} from './spreadsheet';

export class PrivatParser implements StatementParser {
  static readonly requiredHeaders = [
    'Date',
    'Description',
    'Amount in card currency',
    'Card currency',
  ];

  matches(rows: string[][]): boolean {
    return hasHeaders(rows, PrivatParser.requiredHeaders);
  }

  async parse(file: Buffer): Promise<NormalizedTransaction[]> {
    return mapSpreadsheet(file, PrivatParser.requiredHeaders, (row) =>
      this.toNormalizedTransaction(row),
    );
  }

  private toNormalizedTransaction(
    row: Record<string, string>,
  ): NormalizedTransaction | null {
    const date = parseDate(row.Date ?? '');
    if (!date) {
      return null;
    }

    return toSignedTransaction(
      date,
      row.Description,
      parseAmount(row['Amount in card currency']),
      row['Card currency'],
    );
  }
}
