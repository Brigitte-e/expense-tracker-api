import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { NormalizedTransaction } from '../types/normalized-transaction';

const XLSX_MAGIC = [0x50, 0x4b, 0x03, 0x04];

function isXlsx(file: Buffer): boolean {
  return (
    file.length >= 4 && XLSX_MAGIC.every((byte, index) => file[index] === byte)
  );
}

export function readSpreadsheet(file: Buffer): string[][] {
  return isXlsx(file) ? readXlsx(file) : readCsv(file);
}

export type HeaderMatcher = string | ((header: string) => boolean);

export function hasHeaders(
  rows: string[][],
  requiredHeaders: HeaderMatcher[],
): boolean {
  return findHeaderRowIndex(rows, requiredHeaders) !== -1;
}

export function mapSpreadsheet(
  file: Buffer,
  requiredHeaders: HeaderMatcher[],
  mapRow: (row: Record<string, string>) => NormalizedTransaction | null,
): NormalizedTransaction[] {
  const records = extractRecords(readSpreadsheet(file), requiredHeaders);
  return records.flatMap((row) => {
    const transaction = mapRow(row);
    return transaction ? [transaction] : [];
  });
}

function extractRecords(
  rows: string[][],
  requiredHeaders: HeaderMatcher[],
): Record<string, string>[] {
  const headerIndex = findHeaderRowIndex(rows, requiredHeaders);
  if (headerIndex === -1) {
    throw new Error('Statement header row not found');
  }

  const headers = rows[headerIndex].map((header) => header.trim());

  return rows
    .slice(headerIndex + 1)
    .filter((row) => row.some((cell) => cell.trim() !== ''))
    .map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (header) {
          record[header] = (row[index] ?? '').trim();
        }
      });
      return record;
    });
}

export function parseDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const dmy =
    /^(\d{2})\.(\d{2})\.(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(
      trimmed,
    );
  if (dmy) {
    const [, day, month, year, hours = '00', minutes = '00', seconds = '00'] =
      dmy;
    return toValidDate(
      `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`,
    );
  }

  return toValidDate(trimmed.replace(' ', 'T'));
}

export function parseAmount(value: string): number {
  return Number(value.replace(/\s/g, '').replace(',', '.'));
}

export function toSignedTransaction(
  date: Date,
  description: string,
  signedAmount: number,
  currency: string,
): NormalizedTransaction | null {
  if (!description || !currency) {
    return null;
  }

  if (!Number.isFinite(signedAmount) || signedAmount === 0) {
    return null;
  }

  return {
    date,
    description,
    amount: Math.abs(signedAmount),
    currency,
    type: signedAmount < 0 ? 'EXPENSE' : 'INCOME',
  };
}

function findHeaderRowIndex(
  rows: string[][],
  requiredHeaders: HeaderMatcher[],
): number {
  return rows.findIndex((row) =>
    requiredHeaders.every((matcher) =>
      typeof matcher === 'string' ? row.includes(matcher) : row.some(matcher),
    ),
  );
}

function readCsv(file: Buffer): string[][] {
  return parse(file, {
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as string[][];
}

function readXlsx(file: Buffer): string[][] {
  const workbook = XLSX.read(file, { type: 'buffer', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<(string | number | Date | undefined)[]>(
    sheet,
    {
      header: 1,
      defval: '',
      raw: true,
    },
  );

  return rows.map((row) => row.map((cell) => stringifyCell(cell)));
}

function stringifyCell(cell: string | number | Date | undefined): string {
  if (cell == null || cell === '') {
    return '';
  }

  if (cell instanceof Date) {
    if (Number.isNaN(cell.getTime())) {
      return '';
    }
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${cell.getFullYear()}-${pad(cell.getMonth() + 1)}-${pad(cell.getDate())}T${pad(cell.getHours())}:${pad(cell.getMinutes())}:${pad(cell.getSeconds())}`;
  }

  return String(cell).trim();
}

function toValidDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
