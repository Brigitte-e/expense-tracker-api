import { StatementFileValidator } from './statement-file.validator';

describe('StatementFileValidator', () => {
  const validator = new StatementFileValidator();

  it('accepts csv and xlsx statements', () => {
    expect(
      validator.isValid({
        originalname: 'statement.csv',
        mimetype: 'text/csv',
      }),
    ).toBe(true);
    expect(
      validator.isValid({
        originalname: 'statement.xlsx',
        mimetype:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    ).toBe(true);
  });

  it('rejects other file types', () => {
    expect(
      validator.isValid({
        originalname: 'photo.png',
        mimetype: 'image/png',
      }),
    ).toBe(false);
  });
});
