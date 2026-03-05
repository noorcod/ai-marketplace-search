import { Logger, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { HttpLoggerMiddleware } from './common/middlewares/http-logger/http-logger.middleware';
import { HealthModule } from './modules/health/health.module';
import { HttpModule } from '@nestjs/axios';
import { MainModule } from './modules/main/main.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ModelsModule } from './modules/models/models.module';
import { LeadsModule } from './modules/leads/leads.module';
import { EnvModule } from './global-modules/env/env.module';
import { WinstonModule } from 'nest-winston';
import { EnvService } from './global-modules/env/env.service';
import { loggerTransportConfig } from './common/utilities/logger.config';
import { DatabaseModule } from './global-modules/database/database.module';
import { LookupsModule } from './modules/lookups/lookups.module';
import { EventsModule } from './events/events.module';
import { BannersModule } from './modules/banners/banners.module';
import { StoresModule } from './modules/stores/stores.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { ListingsModule } from './modules/listings/listings.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { createRedisOptions } from './common/utilities/redis.config';
import { JwtModule } from '@nestjs/jwt';
import { LegacyOrdersModule } from '@modules/legacy-orders/legacy-orders.module';
import { CartModule } from '@modules/carts/cart.module';
import { SaleEventsModule } from './modules/sale-events/sale-events.module';
import { QuickLinksModule } from './modules/quick-links/quick-links.module';

@Module({
  imports: [
    EnvModule,
    WinstonModule.forRootAsync({
      imports: [],
      useFactory: (env: EnvService) => {
        return {
          transports: loggerTransportConfig(env.nodeEnv),
        };
      },
      inject: [EnvService],
    }),
    RedisModule.forRootAsync({
      imports: undefined,
      useFactory: createRedisOptions,
      inject: [EnvService],
    }),
    DatabaseModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
    }),
    CommonModule,
    MainModule,
    HealthModule,
    ModelsModule,
    LeadsModule,
    LookupsModule,
    EventsModule,
    BannersModule,
    StoresModule,
    UsersModule,
    AuthModule,
    OrdersModule,
    AlertsModule,
    ListingsModule,
    JwtModule.registerAsync({
      useFactory: async (env: EnvService) => ({
        secret: env.jwtSecret,
        signOptions: { expiresIn: env.jwtExpireIn },
      }),
      inject: [EnvService],
      global: true,
    }),
    HttpModule.register({
      timeout: 5000,
      global: true,
    }),
    LegacyOrdersModule,
    CartModule,
    SaleEventsModule,
    QuickLinksModule,
  ],
  providers: [Logger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
