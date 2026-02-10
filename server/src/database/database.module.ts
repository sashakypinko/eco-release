import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { createDatabase, closeDatabase, Database } from './database.factory';

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
export class DatabaseModule implements OnModuleDestroy {
  async onModuleDestroy() {
    await closeDatabase();
  }
}
