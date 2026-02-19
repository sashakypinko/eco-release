import { Injectable, Inject } from '@nestjs/common';
import { eq, and, like, desc, asc, sql, inArray } from 'drizzle-orm';
import type { Database } from '../database/database.module';
import { insertReturning } from '../database/db.util';

const schema = require('../../../shared/schema');

@Injectable()
export class ReleasesService {
  constructor(@Inject('DATABASE') private db: Database) {}

  async getReleases(filters: {
    productId?: number;
    userId?: number;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 25;
    const offset = (page - 1) * pageSize;

    const conditions: any[] = [];

    if (filters.productId) {
      conditions.push(eq(schema.releases.productId, filters.productId));
    }
    if (filters.userId) {
      conditions.push(eq(schema.releases.userId, filters.userId));
    }
    if (filters.status) {
      conditions.push(eq(schema.releases.status, filters.status));
    }
    if (filters.search) {
      conditions.push(like(schema.releases.version, `%${filters.search}%`));
    }
    if (filters.dateFrom) {
      conditions.push(sql`${schema.releases.createdAt} >= ${filters.dateFrom}`);
    }
    if (filters.dateTo) {
      conditions.push(sql`${schema.releases.createdAt} <= ${filters.dateTo}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await (this.db as any)
      .select({ count: sql`COUNT(*)` })
      .from(schema.releases)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    const rows = await (this.db as any)
      .select()
      .from(schema.releases)
      .leftJoin(schema.products, eq(schema.releases.productId, schema.products.id))
      .leftJoin(schema.users, eq(schema.releases.userId, schema.users.id))
      .where(whereClause)
      .orderBy(desc(schema.releases.createdAt))
      .limit(pageSize)
      .offset(offset);

    const data: any[] = [];
    for (const row of rows) {
      const latestHistory = await (this.db as any)
        .select()
        .from(schema.releaseHistories)
        .where(eq(schema.releaseHistories.releaseId, row.releases.id))
        .orderBy(desc(schema.releaseHistories.createdAt))
        .limit(1);

      data.push({
        ...row.releases,
        product: row.products,
        user: row.users,
        latestStatus: latestHistory[0]?.status || row.releases.status,
        latestHistory: latestHistory[0] || null,
      });
    }

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getReleaseById(id: number) {
    const [row] = await (this.db as any)
      .select()
      .from(schema.releases)
      .leftJoin(schema.products, eq(schema.releases.productId, schema.products.id))
      .leftJoin(schema.users, eq(schema.releases.userId, schema.users.id))
      .leftJoin(schema.workOrders, eq(schema.releases.workOrderId, schema.workOrders.id))
      .where(eq(schema.releases.id, id));

    if (!row) return null;

    const histories = await (this.db as any)
      .select()
      .from(schema.releaseHistories)
      .leftJoin(schema.users, eq(schema.releaseHistories.releaseManagerUserId, schema.users.id))
      .where(eq(schema.releaseHistories.releaseId, id))
      .orderBy(desc(schema.releaseHistories.createdAt));

    const historiesWithUsers: any[] = [];
    for (const h of histories) {
      let approvedByUser = null;
      if (h.release_histories.approvedByUserId) {
        const [u] = await (this.db as any).select().from(schema.users).where(eq(schema.users.id, h.release_histories.approvedByUserId));
        approvedByUser = u || null;
      }
      const items = await (this.db as any)
        .select()
        .from(schema.releaseChecklistItems)
        .where(eq(schema.releaseChecklistItems.releaseHistoryId, h.release_histories.id))
        .orderBy(asc(schema.releaseChecklistItems.order));

      historiesWithUsers.push({
        ...h.release_histories,
        releaseManager: h.users,
        approvedByUser,
        checklistItems: items,
      });
    }

    const latestHistory = historiesWithUsers[0] || null;

    return {
      ...row.releases,
      product: row.products,
      user: row.users,
      workOrder: row.work_orders,
      histories: historiesWithUsers,
      latestHistory,
      checklistItems: latestHistory?.checklistItems || [],
    };
  }

  async createRelease(data: any) {
    const release = await insertReturning(this.db, schema.releases, data);

    if (release) {
      const historyData = {
        releaseId: release.id,
        releaseManagerUserId: data.userId || 1,
        status: "Created",
        environment: data.environment,
      };
      const history = await insertReturning(this.db, schema.releaseHistories, historyData);

      if (history && data.productId) {
        await this.autoGenerateChecklistItems(history.id, data.productId, data.environment);
      }
    }

    return release;
  }

  async updateRelease(id: number, data: any) {
    const [existing] = await (this.db as any).select().from(schema.releases).where(eq(schema.releases.id, id));
    if (!existing) return null;

    await (this.db as any).update(schema.releases).set({ ...data, updatedAt: new Date() }).where(eq(schema.releases.id, id));

    if (data.environment && data.environment !== existing.environment) {
      const historyData = {
        releaseId: id,
        releaseManagerUserId: data.userId || existing.userId || 1,
        status: data.status || existing.status || "Created",
        environment: data.environment,
      };
      const history = await insertReturning(this.db, schema.releaseHistories, historyData);
      if (history && (data.productId || existing.productId)) {
        await this.autoGenerateChecklistItems(
          history.id,
          (data.productId || existing.productId),
          data.environment
        );
      }
    }

    const [updated] = await (this.db as any).select().from(schema.releases).where(eq(schema.releases.id, id));
    return updated;
  }

  async deleteRelease(id: number) {
    await (this.db as any).delete(schema.releaseChecklistItems).where(eq(schema.releaseChecklistItems.releaseId, id));
    const hists = await (this.db as any).select().from(schema.releaseHistories).where(eq(schema.releaseHistories.releaseId, id));
    for (const h of hists) {
      await (this.db as any).delete(schema.releaseChecklistItems).where(eq(schema.releaseChecklistItems.releaseHistoryId, h.id));
    }
    await (this.db as any).delete(schema.releaseHistories).where(eq(schema.releaseHistories.releaseId, id));
    await (this.db as any).delete(schema.releases).where(eq(schema.releases.id, id));
  }

  async getReleasesForBoard(filters: {
    productId?: number;
    userId?: number;
    search?: string;
  } = {}) {
    const conditions: any[] = [];
    if (filters.productId) {
      conditions.push(eq(schema.releases.productId, filters.productId));
    }
    if (filters.userId) {
      conditions.push(eq(schema.releases.userId, filters.userId));
    }
    if (filters.search) {
      conditions.push(like(schema.releases.version, `%${filters.search}%`));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await (this.db as any)
      .select()
      .from(schema.releases)
      .leftJoin(schema.products, eq(schema.releases.productId, schema.products.id))
      .leftJoin(schema.users, eq(schema.releases.userId, schema.users.id))
      .where(whereClause)
      .orderBy(desc(schema.releases.createdAt))
      .limit(200);

    const data: any[] = [];
    for (const row of rows) {
      const latestHistory = await (this.db as any)
        .select()
        .from(schema.releaseHistories)
        .where(eq(schema.releaseHistories.releaseId, row.releases.id))
        .orderBy(desc(schema.releaseHistories.createdAt))
        .limit(1);

      data.push({
        ...row.releases,
        product: row.products,
        user: row.users,
        latestStatus: latestHistory[0]?.status || row.releases.status,
      });
    }
    return data;
  }

  async reorderReleases(items: Array<{ id: number; sort_order: number; status?: string }>, userId?: number) {
    const statusChanges: Array<{ id: number; status: string; environment: string }> = [];

    for (const item of items) {
      // sortOrder column not yet in remote DB — only update status for now
      if (item.status) {
        await (this.db as any)
          .update(schema.releases)
          .set({ status: item.status })
          .where(eq(schema.releases.id, item.id));

        const [release] = await (this.db as any)
          .select()
          .from(schema.releases)
          .where(eq(schema.releases.id, item.id));
        if (release) {
          statusChanges.push({ id: item.id, status: item.status, environment: release.environment });
        }
      }
    }

    for (const change of statusChanges) {
      const historyData = {
        releaseId: change.id,
        releaseManagerUserId: userId || 1,
        status: change.status,
        environment: change.environment,
      };
      await insertReturning(this.db, schema.releaseHistories, historyData);
    }

    return { updated: items.length };
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
