import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const user = { id: 'user-1', email: 'ada@example.com' };

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    me: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get(AuthController);
    jest.clearAllMocks();
  });

  it('registers', async () => {
    authService.register.mockResolvedValue({ access_token: 'jwt-token' });
    await expect(
      controller.register({
        email: 'ada@example.com',
        password: 'secret12',
      }),
    ).resolves.toEqual({ access_token: 'jwt-token' });
    expect(authService.register).toHaveBeenCalledWith(
      'ada@example.com',
      'secret12',
    );
  });

  it('logs in', async () => {
    authService.login.mockResolvedValue({ access_token: 'jwt-token' });
    await expect(
      controller.login({
        email: 'ada@example.com',
        password: 'secret12',
      }),
    ).resolves.toEqual({ access_token: 'jwt-token' });
    expect(authService.login).toHaveBeenCalledWith(
      'ada@example.com',
      'secret12',
    );
  });

  it('returns the current user', async () => {
    const profile = {
      id: user.id,
      email: user.email,
      createdAt: '2026-08-28T10:00:00.000Z',
    };
    authService.me.mockResolvedValue(profile);
    await expect(controller.me(user)).resolves.toEqual(profile);
    expect(authService.me).toHaveBeenCalledWith(user.id);
  });
});
