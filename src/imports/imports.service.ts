import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import {
  parserForBank,
  resolveStatementParser,
} from './parsers/resolve-parser';
import { StatementParser } from './parsers/statement-parser.interface';
import { readSpreadsheet } from './parsers/spreadsheet';
import { Bank } from './types/bank';
import { CategorizedTransaction } from './types/categorized-transaction';

export interface ImportResult {
  id: string;
  fileName: string;
  bank: Bank;
  status: 'COMPLETED';
  imported: number;
  skipped: number;
  total: number;
}

@Injectable()
export class ImportsService {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async parseAndCategorize(
    file: Buffer,
    parser?: StatementParser,
  ): Promise<CategorizedTransaction[]> {
    const resolved = parser ?? resolveStatementParser(file);
    const transactions = await resolved.parse(file);
    return this.categoriesService.categorizeAll(transactions);
  }

  async importStatement(input: {
    file: Buffer;
    fileName: string;
    bank: Bank;
    accountId: string;
  }): Promise<ImportResult> {
    const account = await this.prisma.client.orm.public.Account.where({
      id: input.accountId,
    }).first();

    if (!account) {
      throw new NotFoundException(`Account ${input.accountId} not found`);
    }

    if (account.bank !== input.bank) {
      throw new BadRequestException(
        `Account bank is ${account.bank}, expected ${input.bank}`,
      );
    }

    const parser = parserForBank(input.bank);
    if (!parser.matches(readSpreadsheet(input.file))) {
      throw new BadRequestException(
        `File is not a valid ${input.bank} statement`,
      );
    }

    const importRecord = await this.prisma.client.orm.public.Import.create({
      fileName: input.fileName,
      bank: input.bank,
      status: 'PROCESSING',
    });

    try {
      const transactions = await this.parseAndCategorize(input.file, parser);
      const result = await this.transactionsService.createFromImport({
        accountId: input.accountId,
        importId: importRecord.id,
        transactions,
      });

      await this.prisma.client.orm.public.Import.where({
        id: importRecord.id,
      }).update({ status: 'COMPLETED' });

      return {
        id: importRecord.id,
        fileName: input.fileName,
        bank: input.bank,
        status: 'COMPLETED',
        imported: result.imported,
        skipped: result.skipped,
        total: transactions.length,
      };
    } catch (error) {
      await this.prisma.client.orm.public.Import.where({
        id: importRecord.id,
      }).update({ status: 'FAILED' });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new BadRequestException(
        error instanceof Error ? error.message : 'Import failed',
      );
    }
  }
}
