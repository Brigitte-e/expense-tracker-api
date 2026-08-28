import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { CATEGORIES, isCategory } from '../categories/category-rules';
import type { TransactionFilters } from './interfaces/transaction.interface';
import {
  isTransactionType,
  TRANSACTION_TYPES,
} from './interfaces/transaction.interface';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class ParseTransactionFiltersPipe implements PipeTransform<
  Record<string, unknown>,
  TransactionFilters
> {
  transform(query: Record<string, unknown>): TransactionFilters {
    return parseTransactionFilters(query);
  }
}

export function parseTransactionFilters(
  query: Record<string, unknown>,
): TransactionFilters {
  const filters: TransactionFilters = {};

  const category = readString(query.category);
  if (category !== undefined) {
    if (!isCategory(category)) {
      throw new BadRequestException(
        `category must be one of: ${CATEGORIES.join(', ')}`,
      );
    }
    filters.category = category;
  }

  const type = readString(query.type);
  if (type !== undefined) {
    if (!isTransactionType(type)) {
      throw new BadRequestException(
        `type must be one of: ${TRANSACTION_TYPES.join(', ')}`,
      );
    }
    filters.type = type;
  }

  const from = readString(query.from);
  if (from !== undefined) {
    filters.from = parseDateOnly(from, 'from');
  }

  const to = readString(query.to);
  if (to !== undefined) {
    filters.to = parseDateOnly(to, 'to');
  }

  if (filters.from && filters.to && filters.from > filters.to) {
    throw new BadRequestException('from must be on or before to');
  }

  const accountId = readString(query.accountId);
  if (accountId !== undefined) {
    if (!UUID.test(accountId)) {
      throw new BadRequestException('accountId must be a UUID');
    }
    filters.accountId = accountId;
  }

  const minAmount = readNumber(query.minAmount, 'minAmount');
  if (minAmount !== undefined) {
    filters.minAmount = minAmount;
  }

  const maxAmount = readNumber(query.maxAmount, 'maxAmount');
  if (maxAmount !== undefined) {
    filters.maxAmount = maxAmount;
  }

  if (
    filters.minAmount !== undefined &&
    filters.maxAmount !== undefined &&
    filters.minAmount > filters.maxAmount
  ) {
    throw new BadRequestException(
      'minAmount must be less than or equal to maxAmount',
    );
  }

  const search = readString(query.search);
  if (search !== undefined) {
    filters.search = search;
  }

  return filters;
}

export function startOfUtcDay(date: string): string {
  return `${date}T00:00:00.000Z`;
}

export function startOfNextUtcDay(date: string): string {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString();
}

function readString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException('Query parameters must be strings');
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function readNumber(value: unknown, name: string): number | undefined {
  const raw = readString(value);
  if (raw === undefined) {
    return undefined;
  }

  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new BadRequestException(`${name} must be a non-negative number`);
  }

  return amount;
}

function parseDateOnly(value: string, name: string): string {
  if (!DATE_ONLY.test(value)) {
    throw new BadRequestException(`${name} must be YYYY-MM-DD`);
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new BadRequestException(`${name} must be a valid date`);
  }

  return value;
}
