import { Controller, Get } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { AccountsService, type AccountResponse } from './accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser): Promise<AccountResponse[]> {
    return this.accountsService.findAll(user.id);
  }
}
