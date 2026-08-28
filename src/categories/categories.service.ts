import { Injectable } from '@nestjs/common';
import { CategorizedTransaction } from '../imports/types/categorized-transaction';
import { NormalizedTransaction } from '../imports/types/normalized-transaction';
import { Category, matchCategory } from './category-rules';

@Injectable()
export class CategoriesService {
  categorize(transaction: NormalizedTransaction): Category {
    return matchCategory(transaction.description);
  }

  categorizeAll(
    transactions: NormalizedTransaction[],
  ): CategorizedTransaction[] {
    return transactions.map((transaction) => ({
      ...transaction,
      category: this.categorize(transaction),
    }));
  }
}
