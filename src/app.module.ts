import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module.js';
import { EmailModule } from './infrastructure/email/email.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { MoviesModule } from './modules/movies/movies.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { FavoritesModule } from './modules/favorites/favorites.module.js';
import { ShowtimesModule } from './modules/showtimes/showtimes.module.js';
import { SeatsModule } from './modules/seats/seats.module.js';
import { PurchasesModule } from './modules/purchases/purchases.module.js';
import { FeaturesModule } from './modules/features/features.module.js';

@Module({
  imports: [
    EmailModule,
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 100 }],
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    MoviesModule,
    EventsModule,
    FavoritesModule,
    ShowtimesModule,
    SeatsModule,
    PurchasesModule,
    FeaturesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
