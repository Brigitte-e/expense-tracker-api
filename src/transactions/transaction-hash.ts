import { createHash } from 'node:crypto';

export function transactionHash(input: {
  date: Date;
  amount: number;
  description: string;
  accountId: string;
}): string {
  const payload = [
    formatDate(input.date),
    input.amount.toFixed(2),
    input.description,
    input.accountId,
  ].join('\n');

  return createHash('sha256').update(payload).digest('hex');
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
