import { FileValidator } from '@nestjs/common';

const ALLOWED_NAME = /\.(csv|xlsx|xls)$/i;
const ALLOWED_MIME =
  /^(text\/csv|text\/plain|application\/csv|application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|application\/octet-stream)$/i;

export const MAX_STATEMENT_BYTES = 10 * 1024 * 1024;

export class StatementFileValidator extends FileValidator {
  constructor() {
    super({});
  }

  isValid(
    file?:
      | { originalname?: string; mimetype?: string }
      | Array<{ originalname?: string; mimetype?: string }>
      | Record<string, unknown>,
  ): boolean {
    const candidate = Array.isArray(file) ? file[0] : file;
    if (
      !candidate ||
      typeof candidate !== 'object' ||
      !('mimetype' in candidate)
    ) {
      return false;
    }

    const named = candidate as { originalname?: string; mimetype?: string };
    return Boolean(
      named.originalname &&
      ALLOWED_NAME.test(named.originalname) &&
      named.mimetype &&
      ALLOWED_MIME.test(named.mimetype),
    );
  }

  buildErrorMessage(): string {
    return 'Only CSV and XLSX statement files are allowed';
  }
}
