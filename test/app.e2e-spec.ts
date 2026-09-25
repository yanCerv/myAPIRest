import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from '../src/app.config.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/infrastructure/database/prisma/prisma.service.js';

describe('Health endpoint (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('connects to PostgreSQL through Prisma', async () => {
    const prisma = app.get(PrismaService);
    const result = await prisma.$queryRaw<[{ healthy: number }]>`SELECT 1 AS healthy`;

    expect(result).toEqual([{ healthy: 1 }]);
  });

  it('registers a user without exposing the password hash', async () => {
    const email = `register-${randomUUID()}@example.test`;
    const password = 'a-long-password-for-testing';

    try {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password })
        .expect(201);

      expect(response.body).toMatchObject({
        email,
        isActive: true,
      });
      expect(response.body).not.toHaveProperty('passwordHash');

      const prisma = app.get(PrismaService);
      const user = await prisma.user.findUnique({ where: { email } });
      expect(user?.passwordHash).toMatch(/^\$argon2id\$/);
      expect(user?.passwordHash).not.toBe(password);
    } finally {
      await app.get(PrismaService).user.deleteMany({ where: { email } });
    }
  });

  it('rejects unknown registration fields', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `invalid-${randomUUID()}@example.test`,
        password: 'a-long-password-for-testing',
        isAdmin: true,
      })
      .expect(400)
      .expect({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son válidos.',
      });
  });

  it('rejects a duplicate registration email', async () => {
    const email = `duplicate-${randomUUID()}@example.test`;
    const password = 'a-long-password-for-testing';

    try {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password })
        .expect(409);
    } finally {
      await app.get(PrismaService).user.deleteMany({ where: { email } });
    }
  });

  it('logs in and persists only a hash of the refresh token', async () => {
    const email = `login-${randomUUID()}@example.test`;
    const password = 'a-long-password-for-testing';

    try {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(201);

      expect(response.body).toMatchObject({
        tokenType: 'Bearer',
        expiresIn: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
      });
      expect(response.body.accessToken.split('.')).toHaveLength(3);
      expect(response.body.refreshToken).toContain('.');

      const prisma = app.get(PrismaService);
      const user = await prisma.user.findUniqueOrThrow({ where: { email } });
      const session = await prisma.refreshSession.findFirstOrThrow({
        where: { userId: user.id },
      });
      expect(session.tokenHash).not.toBe(response.body.refreshToken);
      await expect(
        argon2.verify(session.tokenHash, response.body.refreshToken),
      ).resolves.toBe(true);
    } finally {
      await app.get(PrismaService).user.deleteMany({ where: { email } });
    }
  });

  it('returns the same unauthorized response for unknown credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: `unknown-${randomUUID()}@example.test`,
        password: 'a-long-password-for-testing',
      })
      .expect(401)
      .expect({
        statusCode: 401,
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Correo o contraseña inválidos.',
      });
  });

  it('accepts password recovery requests without exposing account existence', async () => {
    const email = `password-reset-${randomUUID()}@example.test`;
    const password = 'a-long-password-for-testing';

    try {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password })
        .expect(201);

      const knownAccount = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email })
        .expect(202);
      const unknownAccount = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: `unknown-${randomUUID()}@example.test` })
        .expect(202);

      expect(knownAccount.body).toEqual(unknownAccount.body);

      const prisma = app.get(PrismaService);
      const user = await prisma.user.findUniqueOrThrow({ where: { email } });
      const token = await prisma.accountActionToken.findFirstOrThrow({
        where: { userId: user.id, purpose: 'RESET_PASSWORD' },
      });
      expect(token.tokenHash).toMatch(/^\$argon2id\$/);
      expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(token.consumedAt).toBeNull();
    } finally {
      await app.get(PrismaService).user.deleteMany({ where: { email } });
    }
  });

  it('rejects an invalid OTP when resetting a password', async () => {
    const email = `invalid-reset-${randomUUID()}@example.test`;
    const password = 'a-long-password-for-testing';

    try {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password })
        .expect(201);
      await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email })
        .expect(202);

      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ email, otp: '000000', newPassword: 'another-secure-password' })
        .expect(401);
    } finally {
      await app.get(PrismaService).user.deleteMany({ where: { email } });
    }
  });

  it('limits authentication attempts by IP address', async () => {
    const requestBody = {
      email: `rate-limit-${randomUUID()}@example.test`,
      password: 'a-long-password-for-testing',
    };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(requestBody)
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(requestBody)
      .expect(429);
  });

  it('rotates and revokes refresh sessions', async () => {
    const email = `session-${randomUUID()}@example.test`;
    const password = 'a-long-password-for-testing';
    try {
      await request(app.getHttpServer()).post('/api/v1/auth/register').send({ email, password }).expect(201);
      const login = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email, password }).expect(201);
      const firstToken = login.body.refreshToken as string;
      const refresh = await request(app.getHttpServer()).post('/api/v1/auth/refresh').send({ refreshToken: firstToken }).expect(201);
      const secondToken = refresh.body.refreshToken as string;
      expect(secondToken).not.toBe(firstToken);
      await request(app.getHttpServer()).post('/api/v1/auth/refresh').send({ refreshToken: firstToken }).expect(401);
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ refreshToken: secondToken })
        .expect(200)
        .expect({ success: true });
      await request(app.getHttpServer()).post('/api/v1/auth/refresh').send({ refreshToken: secondToken }).expect(401);
    } finally {
      await app.get(PrismaService).user.deleteMany({ where: { email } });
    }
  });

  it('returns only the authenticated user safe profile', async () => {
    const email = `profile-${randomUUID()}@example.test`;
    const password = 'a-long-password-for-testing';

    try {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password })
        .expect(201);
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({ email, isActive: true });
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('sessions');
    } finally {
      await app.get(PrismaService).user.deleteMany({ where: { email } });
    }
  });

  it('rejects missing and refresh-token authentication for /users/me', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .expect(401)
      .expect({
        statusCode: 401,
        code: 'AUTH_UNAUTHORIZED',
        message: 'No estás autorizado para realizar esta acción.',
      });

    const email = `wrong-token-${randomUUID()}@example.test`;
    const password = 'a-long-password-for-testing';
    try {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password })
        .expect(201);
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(201);
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${login.body.refreshToken}`)
        .expect(401);
    } finally {
      await app.get(PrismaService).user.deleteMany({ where: { email } });
    }
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });
});
