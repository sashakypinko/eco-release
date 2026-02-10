import { Injectable, Inject } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import type { Database } from '../database/database.module';

const schema = require('../../../shared/schema');

@Injectable()
export class ReferenceDataService {
  constructor(@Inject('DATABASE') private db: Database) {}

  async getProducts() {
    return (this.db as any).select().from(schema.products).orderBy(asc(schema.products.name));
  }

  async getUsers() {
    return (this.db as any).select().from(schema.users).orderBy(asc(schema.users.name));
  }

  async getWorkOrders() {
    return (this.db as any).select().from(schema.workOrders).orderBy(asc(schema.workOrders.title));
  }
}
