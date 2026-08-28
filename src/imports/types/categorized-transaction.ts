import { Category } from '../../categories/category-rules';
import { NormalizedTransaction } from './normalized-transaction';

export interface CategorizedTransaction extends NormalizedTransaction {
  category: Category;
}
