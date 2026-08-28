import { NormalizedTransaction } from '../types/normalized-transaction';
import { StatementParser } from './statement-parser.interface';
import {
  hasHeaders,
  mapSpreadsheet,
  parseAmount,
  parseDate,
  toSignedTransaction,
} from './spreadsheet';

export class RevolutParser implements StatementParser {
  static readonly requiredHeaders = [
    'Type',
    'Started Date',
    'Completed Date',
    'Description',
    'Amount',
    'Currency',
    'State',
  ];

  matches(rows: string[][]): boolean {
    return hasHeaders(rows, RevolutParser.requiredHeaders);
  }

  async parse(file: Buffer): Promise<NormalizedTransaction[]> {
    return mapSpreadsheet(file, RevolutParser.requiredHeaders, (row) =>
      this.toNormalizedTransaction(row),
    );
  }

  private toNormalizedTransaction(
    row: Record<string, string>,
  ): NormalizedTransaction | null {
    if (row.State !== 'COMPLETED') {
      return null;
    }

    const date = parseDate(row['Completed Date'] || row['Started Date'] || '');
    if (!date) {
      return null;
    }

    return toSignedTransaction(
      date,
      row.Description,
      parseAmount(row.Amount),
      row.Currency,
    );
  }
}
