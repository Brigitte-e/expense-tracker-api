import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { IS_PUBLIC_KEY } from './public.decorator';

function contextWithAuth(authorization?: string): ExecutionContext {
  const request = {
    headers: authorization ? { authorization } : {},
  };
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('AuthGuard', () => {
  const jwtService = { verifyAsync: jest.fn() };
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new AuthGuard(
    jwtService as unknown as JwtService,
    reflector as unknown as Reflector,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows public routes', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    await expect(guard.canActivate(contextWithAuth())).resolves.toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects a missing token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    await expect(guard.canActivate(contextWithAuth())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an invalid token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyAsync.mockRejectedValue(new Error('bad token'));

    await expect(
      guard.canActivate(contextWithAuth('Bearer bad')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the user from a valid token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'ada@example.com',
    });
    const context = contextWithAuth('Bearer jwt-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(context.switchToHttp().getRequest()).toMatchObject({
      user: { id: 'user-1', email: 'ada@example.com' },
    });
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      expect.anything(),
      expect.anything(),
    ]);
  });
});
