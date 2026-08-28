import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { ImportsService, type ImportResult } from './imports.service';
import { ParseBankPipe } from './parse-bank.pipe';
import {
  MAX_STATEMENT_BYTES,
  StatementFileValidator,
} from './statement-file.validator';
import type { Bank } from './types/bank';

type StatementUpload = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_STATEMENT_BYTES } }),
  )
  importStatement(
    @CurrentUser() user: AuthUser,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_STATEMENT_BYTES }),
          new StatementFileValidator(),
        ],
      }),
    )
    file: StatementUpload,
    @Body('bank', ParseBankPipe) bank: Bank,
    @Body('accountId', ParseUUIDPipe) accountId: string,
  ): Promise<ImportResult> {
    return this.importsService.importStatement({
      userId: user.id,
      file: file.buffer,
      fileName: file.originalname,
      bank,
      accountId,
    });
  }
}
