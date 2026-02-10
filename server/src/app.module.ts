import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ChecklistModule } from './checklist/checklist.module';
import { ReleaseHistoriesModule } from './release-histories/release-histories.module';
import { ReleasesModule } from './releases/releases.module';
import { ReferenceDataModule } from './reference-data/reference-data.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ChecklistModule,
    ReleaseHistoriesModule,
    ReleasesModule,
    ReferenceDataModule,
  ],
})
export class AppModule {}
