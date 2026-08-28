import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import type { AuthUser, PublicUser } from './auth-user';
import { AuthService, type AuthTokenResponse } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { CredentialsDto, ParseCredentialsPipe } from './parse-credentials.pipe';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CredentialsDto })
  register(
    @Body(ParseCredentialsPipe) dto: CredentialsDto,
  ): Promise<AuthTokenResponse> {
    return this.authService.register(dto.email, dto.password);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: CredentialsDto })
  login(
    @Body(ParseCredentialsPipe) dto: CredentialsDto,
  ): Promise<AuthTokenResponse> {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): Promise<PublicUser> {
    return this.authService.me(user.id);
  }
}
