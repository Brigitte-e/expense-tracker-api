import { Test, TestingModule } from '@nestjs/testing';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';

const user = { id: 'user-1', email: 'a@b.c' };

describe('ImportsController', () => {
  let controller: ImportsController;
  const importsService = {
    importStatement: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportsController],
      providers: [{ provide: ImportsService, useValue: importsService }],
    }).compile();

    controller = module.get(ImportsController);
    jest.clearAllMocks();
  });

  it('forwards the uploaded statement to the service', async () => {
    const result = {
      id: 'import-1',
      fileName: 'statement.csv',
      bank: 'REVOLUT' as const,
      status: 'COMPLETED' as const,
      imported: 2,
      skipped: 0,
      total: 2,
    };
    importsService.importStatement.mockResolvedValue(result);

    await expect(
      controller.importStatement(
        user,
        {
          buffer: Buffer.from('csv'),
          originalname: 'statement.csv',
          mimetype: 'text/csv',
          size: 3,
        },
        'REVOLUT',
        '33333333-3333-4333-8333-333333333333',
      ),
    ).resolves.toEqual(result);
    expect(importsService.importStatement).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user.id }),
    );
  });
});
