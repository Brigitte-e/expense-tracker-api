import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Numeric } from '@prisma/orm-postgres/target/codec-types';
import { CategorizedTransaction } from '../imports/types/categorized-transaction';
import { PrismaService } from '../prisma/prisma.service';
import type {
  Transaction,
  UpdateTransactionDto,
} from './interfaces/transaction.interface';
import { transactionHash } from './transaction-hash';

type TransactionRow = {
  id: string;
  date: string;
  description: string;
  merchant: string | null;
  amount: unknown;
  currency: string;
  type: 'INCOME' | 'EXPENSE';
  accountId: string;
  importId: string | null;
  createdAt: string;
  category: { name?: unknown };
};

type TransactionInsert = {
  date: string;
  description: string;
  merchant: string | null;
  amount: Numeric<19, 4>;
  currency: string;
  type: 'INCOME' | 'EXPENSE';
  transactionHash: string;
  categoryId: string;
  accountId: string;
  importId: string;
};

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Transaction[]> {
    const rows = await this.prisma.client.orm.public.Transaction.include(
      'category',
    )
      .orderBy((transaction) => transaction.date.desc())
      .all();

    return rows.map((row) => this.toResponse(row));
  }

  async findOne(id: string): Promise<Transaction> {
    const row = await this.prisma.client.orm.public.Transaction.where({ id })
      .include('category')
      .first();

    if (!row) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    return this.toResponse(row);
  }

  async update(id: string, dto: UpdateTransactionDto): Promise<Transaction> {
    await this.findOne(id);

    if (dto.category === undefined) {
      return this.findOne(id);
    }

    const category = await this.prisma.client.orm.public.Category.where({
      name: dto.category,
    }).first();

    if (!category) {
      throw new BadRequestException(`Unknown category: ${dto.category}`);
    }

    await this.prisma.client.orm.public.Transaction.where({ id }).update({
      categoryId: category.id,
    });

    return this.findOne(id);
  }

  async remove(id: string): Promise<Transaction> {
    const existing = await this.findOne(id);
    await this.prisma.client.orm.public.Transaction.where({ id }).delete();
    return existing;
  }

  async createFromImport(input: {
    accountId: string;
    importId: string;
    transactions: CategorizedTransaction[];
  }): Promise<{ imported: number; skipped: number }> {
    const categories = await this.prisma.client.orm.public.Category.all();
    const categoryIds = new Map(
      categories.map((category) => [category.name, category.id]),
    );

    const unique = new Map<
      string,
      CategorizedTransaction & { transactionHash: string }
    >();

    for (const transaction of input.transactions) {
      const hash = transactionHash({
        date: transaction.date,
        amount: transaction.amount,
        description: transaction.description,
        accountId: input.accountId,
      });
      if (!unique.has(hash)) {
        unique.set(hash, { ...transaction, transactionHash: hash });
      }
    }

    const hashes = [...unique.keys()];
    const existing = hashes.length
      ? await this.prisma.client.orm.public.Transaction.where({
          accountId: input.accountId,
        })
          .select('transactionHash')
          .all()
      : [];
    const existingHashes = new Set(existing.map((row) => row.transactionHash));

    const toInsert = [...unique.values()].filter(
      (transaction) => !existingHashes.has(transaction.transactionHash),
    );

    if (toInsert.length > 0) {
      await this.insertSkippingDuplicates(
        toInsert.map((transaction) => {
          const categoryId = categoryIds.get(transaction.category);
          if (!categoryId) {
            throw new BadRequestException(
              `Unknown category: ${transaction.category}`,
            );
          }

          return {
            date: transaction.date.toISOString(),
            description: transaction.description,
            merchant: transaction.merchant ?? null,
            amount: toNumericAmount(transaction.amount),
            currency: transaction.currency,
            type: transaction.type,
            transactionHash: transaction.transactionHash,
            categoryId,
            accountId: input.accountId,
            importId: input.importId,
          };
        }),
      );
    }

    return {
      imported: toInsert.length,
      skipped: input.transactions.length - toInsert.length,
    };
  }

  private async insertSkippingDuplicates(
    rows: TransactionInsert[],
  ): Promise<void> {
    try {
      await this.prisma.client.orm.public.Transaction.createAll(rows);
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      for (const row of rows) {
        try {
          await this.prisma.client.orm.public.Transaction.create(row);
        } catch (inner) {
          if (!isUniqueViolation(inner)) {
            throw inner;
          }
        }
      }
    }
  }

  private toResponse(row: TransactionRow): Transaction {
    if (typeof row.category.name !== 'string') {
      throw new Error('Transaction is missing category name');
    }

    return {
      id: row.id,
      date: row.date,
      description: row.description,
      merchant: row.merchant,
      amount: Number(row.amount),
      currency: row.currency,
      type: row.type,
      category: row.category.name,
      accountId: row.accountId,
      importId: row.importId,
      createdAt: row.createdAt,
    };
  }
}

function toNumericAmount(amount: number): Numeric<19, 4> {
  return amount.toFixed(4) as Numeric<19, 4>;
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    code?: string;
    cause?: { code?: string };
    message?: string;
  };

  return (
    candidate.code === '23505' ||
    candidate.cause?.code === '23505' ||
    (typeof candidate.message === 'string' &&
      /unique|duplicate/i.test(candidate.message))
  );
}
