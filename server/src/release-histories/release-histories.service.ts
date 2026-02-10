import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, asc } from 'drizzle-orm';
import type { Database } from '../database/database.module';
import { insertReturning } from '../database/db.util';

const schema = require('../../../shared/schema');

@Injectable()
export class ReleaseHistoriesService {
  constructor(@Inject('DATABASE') private db: Database) {}

  async getHistories(releaseId: number) {
    const rows = await (this.db as any)
      .select()
      .from(schema.releaseHistories)
      .leftJoin(schema.users, eq(schema.releaseHistories.releaseManagerUserId, schema.users.id))
      .where(eq(schema.releaseHistories.releaseId, releaseId))
      .orderBy(desc(schema.releaseHistories.createdAt));

    const result: any[] = [];
    for (const r of rows) {
      let approvedByUser = null;
      if (r.release_histories.approvedByUserId) {
        const [u] = await (this.db as any).select().from(schema.users).where(eq(schema.users.id, r.release_histories.approvedByUserId));
        approvedByUser = u || null;
      }
      const items = await (this.db as any)
        .select()
        .from(schema.releaseChecklistItems)
        .where(eq(schema.releaseChecklistItems.releaseHistoryId, r.release_histories.id))
        .orderBy(asc(schema.releaseChecklistItems.order));

      result.push({
        ...r.release_histories,
        releaseManager: r.users,
        approvedByUser,
        checklistItems: items,
      });
    }
    return result;
  }

  async createHistory(data: any) {
    const history = await insertReturning(this.db, schema.releaseHistories, data);

    if (history) {
      const [release] = await (this.db as any).select().from(schema.releases).where(eq(schema.releases.id, data.releaseId));
      if (release?.productId) {
        await this.autoGenerateChecklistItems(history.id, release.productId, data.environment);
      }
    }

    return history;
  }

  async updateHistory(id: number, data: any) {
    await (this.db as any).update(schema.releaseHistories).set({ ...data, updatedAt: new Date() }).where(eq(schema.releaseHistories.id, id));
    const [updated] = await (this.db as any).select().from(schema.releaseHistories).where(eq(schema.releaseHistories.id, id));
    return updated;
  }

  async deleteHistory(id: number) {
    await (this.db as any).delete(schema.releaseChecklistItems).where(eq(schema.releaseChecklistItems.releaseHistoryId, id));
    await (this.db as any).delete(schema.releaseHistories).where(eq(schema.releaseHistories.id, id));
  }

  private async autoGenerateChecklistItems(releaseHistoryId: number, productId: number, environment: string) {
    const [pe] = await (this.db as any)
      .select()
      .from(schema.productEnvironments)
      .where(
        and(
          eq(schema.productEnvironments.productId, productId),
          eq(schema.productEnvironments.environment, environment)
        )
      );

    if (pe?.releaseChecklistTemplateId) {
      const templateItems = await (this.db as any)
        .select()
        .from(schema.releaseChecklistTemplateItems)
        .where(eq(schema.releaseChecklistTemplateItems.releaseChecklistTemplateId, pe.releaseChecklistTemplateId))
        .orderBy(asc(schema.releaseChecklistTemplateItems.order));

      if (templateItems.length > 0) {
        await (this.db as any).insert(schema.releaseChecklistItems).values(
          templateItems.map((item: any) => ({
            releaseHistoryId,
            text: item.text,
            order: item.order,
            done: false,
          }))
        );
      }
    }
  }
}
