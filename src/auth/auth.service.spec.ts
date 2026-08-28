import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

const user = {
  id: 'user-1',
  email: 'ada@example.com',
  passwordHash:
    '$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZabcde',
  createdAt: '2026-08-28T10:00:00.000Z',
};

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    provisionDefaults: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jwtService.signAsync.mockResolvedValue('jwt-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('registers a user and returns an access token', async () => {
    usersService.create.mockResolvedValue(user);
    usersService.provisionDefaults.mockResolvedValue(undefined);

    await expect(
      service.register('ada@example.com', 'secret12'),
    ).resolves.toEqual({ access_token: 'jwt-token' });

    expect(usersService.create).toHaveBeenCalledWith(
      'ada@example.com',
      expect.any(String),
    );
    expect(usersService.provisionDefaults).toHaveBeenCalledWith(user.id);
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
    });
  });

  it('propagates a duplicate-email conflict', async () => {
    usersService.create.mockRejectedValue(
      new ConflictException('Email already registered'),
    );

    await expect(
      service.register('ada@example.com', 'secret12'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(usersService.provisionDefaults).not.toHaveBeenCalled();
  });

  it('logs in with a matching password', async () => {
    const { hash } = await import('bcryptjs');
    const passwordHash = await hash('secret12', 4);
    usersService.findByEmail.mockResolvedValue({ ...user, passwordHash });

    await expect(
      service.login('ada@example.com', 'secret12'),
    ).resolves.toEqual({ access_token: 'jwt-token' });
  });

  it('rejects an unknown email', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login('ada@example.com', 'secret12'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a wrong password', async () => {
    const { hash } = await import('bcryptjs');
    usersService.findByEmail.mockResolvedValue({
      ...user,
      passwordHash: await hash('other-password', 4),
    });

    await expect(
      service.login('ada@example.com', 'secret12'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns the public profile', async () => {
    usersService.findById.mockResolvedValue(user);

    await expect(service.me(user.id)).resolves.toEqual({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    });
  });

  it('rejects me when the user no longer exists', async () => {
    usersService.findById.mockResolvedValue(null);
    await expect(service.me(user.id)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
