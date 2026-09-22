import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';
import type { HashOptions } from 'argon2';
import type { PasswordHasher } from '../application/password-hasher.port.js';

const ARGON2_OPTIONS = {
  type: argon2.argon2id as 2,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
} satisfies HashOptions;

@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return argon2.hash(password, ARGON2_OPTIONS);
  }

  verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
