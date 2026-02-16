import { Module, Global, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createDatabase, closeDatabase, runMigrations, Database } from './database.factory';

const { db, schema } = createDatabase();

export { Database };

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE',
      useValue: db,
    },
    {
      provide: 'SCHEMA',
      useValue: schema,
    },
  ],
  exports: ['DATABASE', 'SCHEMA'],
})
export class DatabaseModule implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await runMigrations();
  }

  async onModuleDestroy() {
    await closeDatabase();
  }
}
