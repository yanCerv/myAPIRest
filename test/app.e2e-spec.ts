import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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

  afterEach(async () => {
    await app.close();
  });
});
