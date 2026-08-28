import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { BANKS, Bank, isBank } from './types/bank';

@Injectable()
export class ParseBankPipe implements PipeTransform<unknown, Bank> {
  transform(value: unknown): Bank {
    if (!isBank(value)) {
      throw new BadRequestException(`bank must be one of: ${BANKS.join(', ')}`);
    }
    return value;
  }
}
