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
  TransactionFilters,
  UpdateTransactionDto,
} from './interfaces/transaction.interface';
import {
  startOfNextUtcDay,
  startOfUtcDay,
} from './parse-transaction-filters.pipe';
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
  userId: string;
  categoryId: string;
  accountId: string;
  importId: string;
};

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    filters: TransactionFilters = {},
  ): Promise<Transaction[]> {
    const query = await this.filteredQuery(userId, filters);
    if (!query) {
      return [];
    }

    const rows = await query
      .orderBy((transaction) => transaction.date.desc())
      .all();

    const transactions = rows.map((row) => this.toResponse(row));
    if (!filters.search) {
      return transactions;
    }

    const search = filters.search.toLowerCase();
    return transactions.filter(
      (transaction) =>
        transaction.description.toLowerCase().includes(search) ||
        transaction.merchant?.toLowerCase().includes(search),
    );
  }

  async findOne(userId: string, id: string): Promise<Transaction> {
    const row = await this.prisma.client.orm.public.Transaction.where({
      id,
      userId,
    })
      .include('category')
      .first();

    if (!row) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }

    return this.toResponse(row);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    await this.findOne(userId, id);

    if (dto.category === undefined) {
      return this.findOne(userId, id);
    }

    const category = await this.prisma.client.orm.public.Category.where({
      name: dto.category,
      userId,
    }).first();

    if (!category) {
      throw new BadRequestException(`Unknown category: ${dto.category}`);
    }

    await this.prisma.client.orm.public.Transaction.where({ id }).update({
      categoryId: category.id,
    });

    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string): Promise<Transaction> {
    const existing = await this.findOne(userId, id);
    await this.prisma.client.orm.public.Transaction.where({ id }).delete();
    return existing;
  }

  async createFromImport(input: {
    userId: string;
    accountId: string;
    importId: string;
    transactions: CategorizedTransaction[];
  }): Promise<{ imported: number; skipped: number }> {
    const categories = await this.prisma.client.orm.public.Category.where({
      userId: input.userId,
    }).all();
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
            userId: input.userId,
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

  private async filteredQuery(userId: string, filters: TransactionFilters) {
    let query = this.prisma.client.orm.public.Transaction.where({
      userId,
    }).include('category');

    if (filters.category) {
      const category = await this.prisma.client.orm.public.Category.where({
        name: filters.category,
        userId,
      }).first();

      if (!category) {
        return null;
      }

      query = query.where({ categoryId: category.id });
    }

    if (filters.type) {
      query = query.where({ type: filters.type });
    }

    if (filters.accountId) {
      query = query.where({ accountId: filters.accountId });
    }

    if (filters.from) {
      const from = startOfUtcDay(filters.from);
      query = query.where((transaction) => transaction.date.gte(from));
    }

    if (filters.to) {
      const to = startOfNextUtcDay(filters.to);
      query = query.where((transaction) => transaction.date.lt(to));
    }

    if (filters.minAmount !== undefined) {
      const minAmount = toNumericAmount(filters.minAmount);
      query = query.where((transaction) => transaction.amount.gte(minAmount));
    }

    if (filters.maxAmount !== undefined) {
      const maxAmount = toNumericAmount(filters.maxAmount);
      query = query.where((transaction) => transaction.amount.lte(maxAmount));
    }

    return query;
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
