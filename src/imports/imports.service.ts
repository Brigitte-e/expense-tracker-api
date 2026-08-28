import { Injectable } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { resolveStatementParser } from './parsers/resolve-parser';
import { StatementParser } from './parsers/statement-parser.interface';
import { CategorizedTransaction } from './types/categorized-transaction';

@Injectable()
export class ImportsService {
  constructor(private readonly categoriesService: CategoriesService) {}

  async parseAndCategorize(
    file: Buffer,
    parser?: StatementParser,
  ): Promise<CategorizedTransaction[]> {
    const resolved = parser ?? resolveStatementParser(file);
    const transactions = await resolved.parse(file);
    return this.categoriesService.categorizeAll(transactions);
  }
}
