export const BANKS = ['REVOLUT', 'MONOBANK', 'PRIVAT'] as const;

export type Bank = (typeof BANKS)[number];

export function isBank(value: unknown): value is Bank {
  return (
    typeof value === 'string' && (BANKS as readonly string[]).includes(value)
  );
}
