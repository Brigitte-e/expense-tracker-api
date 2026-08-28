import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { UsersService, type UserRecord } from '../users/users.service';
import type { PublicUser } from './auth-user';

export type AuthTokenResponse = {
  access_token: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
  ): Promise<AuthTokenResponse> {
    const passwordHash = await hash(password, 10);
    const user = await this.usersService.create(email, passwordHash);
    await this.usersService.provisionDefaults(user.id);
    return this.issueToken(user);
  }

  async login(email: string, password: string): Promise<AuthTokenResponse> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await compare(password, user.passwordHash))) {
      throw new UnauthorizedException();
    }

    return this.issueToken(user);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    return toPublicUser(user);
  }

  private async issueToken(user: UserRecord): Promise<AuthTokenResponse> {
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}
