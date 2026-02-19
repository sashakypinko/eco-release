import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ChecklistModule } from './checklist/checklist.module';
import { ReleaseHistoriesModule } from './release-histories/release-histories.module';
import { ReleasesModule } from './releases/releases.module';
import { ReferenceDataModule } from './reference-data/reference-data.module';
import { PermissionsModule } from './permissions/permissions.module';
import { HealthModule } from './health/health.module';
import { AppConfigModule } from './config/app-config.module';
import { PermissionGuard } from './guards/permission.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ChecklistModule,
    ReleaseHistoriesModule,
    ReleasesModule,
    ReferenceDataModule,
    PermissionsModule,
    HealthModule,
    AppConfigModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
