import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class CredentialsDto {
  @ApiProperty({ type: String, example: 'ada@example.com' })
  email: string;

  @ApiProperty({
    type: String,
    minLength: 8,
    maxLength: 72,
    example: 'secret12',
  })
  password: string;
}

const EMAIL =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

@Injectable()
export class ParseCredentialsPipe implements PipeTransform<
  unknown,
  CredentialsDto
> {
  transform(body: unknown): CredentialsDto {
    return parseCredentials(body);
  }
}

export function parseCredentials(body: unknown): CredentialsDto {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('Body must be an object');
  }

  const record = body as Record<string, unknown>;
  const email = readEmail(record.email);
  const password = readPassword(record.password);

  return { email, password };
}

function readEmail(value: unknown): string {
  if (typeof value !== 'string') {
    throw new BadRequestException('email is required');
  }

  const email = value.trim().toLowerCase();
  if (email === '' || !EMAIL.test(email) || email.length > 255) {
    throw new BadRequestException('email must be a valid email address');
  }

  return email;
}

function readPassword(value: unknown): string {
  if (typeof value !== 'string') {
    throw new BadRequestException('password is required');
  }

  if (value.length < 8 || value.length > 72) {
    throw new BadRequestException('password must be 8 to 72 characters');
  }

  return value;
}
