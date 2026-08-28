import { NormalizedTransaction } from '../types/normalized-transaction';

export interface StatementParser {
  matches(rows: string[][]): boolean;
  parse(file: Buffer): Promise<NormalizedTransaction[]>;
}
