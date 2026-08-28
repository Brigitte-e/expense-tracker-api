import { Injectable } from '@nestjs/common';
import type { Bank } from '../imports/types/bank';
import { PrismaService } from '../prisma/prisma.service';

export type AccountResponse = {
  id: string;
  name: string;
  bank: Bank;
  currency: string;
  createdAt: string;
};

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<AccountResponse[]> {
    const rows = await this.prisma.client.orm.public.Account.where({
      userId,
    }).all();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      bank: row.bank,
      currency: row.currency,
      createdAt: row.createdAt,
    }));
  }
}
