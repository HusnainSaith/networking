import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { AuthModule } from './modules/auth/auth.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import databaseConfig from './config/database.config';
import { PermissionsModule } from './modules/permissions/permissions.module';

// Global Guards and Interceptors

import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { RolePermissionsModule } from './modules/role-permissions/role-permissions.module';
import { SharedModule } from './modules/shared/shared.module';
import { GuardsModule } from './common/modules/guards.module';
import { CustomersModule } from './modules/customers/customers.module';
import { TechniciansModule } from './modules/technicians/technicians.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { RoutingModule } from './modules/routing/routing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
      expandVariables: true,
    }),

    // Database Configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60000), // 1 minute
            limit: config.get<number>('THROTTLE_LIMIT', 100), // 100 requests
          },
        ],
      }),
    }),
    ScheduleModule.forRoot(),
    // Core modules
    GuardsModule,
    SharedModule,
    UsersModule,
    RolesModule,
    AuthModule,
    PermissionsModule,
    RolePermissionsModule,
    CustomersModule,
    TechniciansModule,
    ActivitiesModule,
    TrackingModule,
    RoutingModule,
    NotificationsModule,
    FeedbackModule,
    DashboardModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    // Global Rate Limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // Global Authentication Guard (Optional - Uncomment if needed)
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },

    // Global Roles Guard (Optional - Uncomment if needed)
    // {
    //   provide: APP_GUARD,
    //   useClass: RolesGuard,
    // },

    // Global Permissions Guard (Optional - Uncomment if needed)
    // {
    //   provide: APP_GUARD,
    //   useClass: PermissionsGuard,
    // },

    // Global Response Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },

    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    AppService,
  ],
})
export class AppModule {}
