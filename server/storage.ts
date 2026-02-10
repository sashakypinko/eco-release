import { db } from "./db";
import { eq, and, like, desc, asc, sql } from "drizzle-orm";
import {
  releases,
  releaseHistories,
  releaseChecklistItems,
  releaseChecklistTemplates,
  releaseChecklistTemplateItems,
  productEnvironments,
  products,
  users,
  workOrders,
} from "@shared/schema";
import type {
  Release,
  InsertRelease,
  ReleaseHistory,
  InsertReleaseHistory,
  ReleaseChecklistItem,
  ReleaseChecklistTemplate,
  ReleaseChecklistTemplateItem,
  Product,
  User,
  WorkOrder,
} from "@shared/schema";

async function insertReturning(table: any, values: any): Promise<any> {
  const result = await db.insert(table).values(values);
  const insertId = (result as any)[0]?.insertId;
  if (insertId) {
    const [row] = await db.select().from(table).where(eq(table.id, insertId));
    return row;
  }
  return null;
}

export interface IStorage {
  getReleases(filters?: {
    productId?: number;
    userId?: number;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: any[]; total: number; page: number; pageSize: number; totalPages: number }>;

  getReleaseById(id: number): Promise<any>;
  createRelease(data: InsertRelease): Promise<any>;
  updateRelease(id: number, data: Partial<InsertRelease>): Promise<any>;
  deleteRelease(id: number): Promise<void>;

  getReleaseHistories(releaseId: number): Promise<any[]>;
  createReleaseHistory(data: InsertReleaseHistory): Promise<any>;
  updateReleaseHistory(id: number, data: Partial<InsertReleaseHistory>): Promise<any>;
  deleteReleaseHistory(id: number): Promise<void>;

  getChecklistItems(releaseHistoryId: number): Promise<ReleaseChecklistItem[]>;
  updateChecklistItemState(id: number, done: boolean): Promise<ReleaseChecklistItem | null>;

  getChecklistTemplates(): Promise<any[]>;
  getChecklistTemplateById(id: number): Promise<any>;
  createChecklistTemplate(name: string): Promise<any>;
  updateChecklistTemplate(id: number, name: string): Promise<any>;
  deleteChecklistTemplate(id: number): Promise<void>;
  replaceChecklistTemplateItems(templateId: number, items: { text: string; order: number }[]): Promise<any>;

  getProducts(): Promise<Product[]>;
  getUsers(): Promise<User[]>;
  getWorkOrdersByProduct(productId: number): Promise<WorkOrder[]>;

  autoGenerateChecklistItems(releaseHistoryId: number, productId: number, environment: string): Promise<void>;
}

export class MySQLStorage implements IStorage {
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
      conditions.push(eq(releases.productId, filters.productId));
    }
    if (filters.userId) {
      conditions.push(eq(releases.userId, filters.userId));
    }
    if (filters.status) {
      conditions.push(eq(releases.status, filters.status));
    }
    if (filters.search) {
      conditions.push(like(releases.version, `%${filters.search}%`));
    }
    if (filters.dateFrom) {
      conditions.push(sql`${releases.createdAt} >= ${filters.dateFrom}`);
    }
    if (filters.dateTo) {
      conditions.push(sql`${releases.createdAt} <= ${filters.dateTo}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(releases)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    const rows = await db
      .select()
      .from(releases)
      .leftJoin(products, eq(releases.productId, products.id))
      .leftJoin(users, eq(releases.userId, users.id))
      .where(whereClause)
      .orderBy(desc(releases.createdAt))
      .limit(pageSize)
      .offset(offset);

    const data = [];
    for (const row of rows) {
      const latestHistory = await db
        .select()
        .from(releaseHistories)
        .where(eq(releaseHistories.releaseId, row.releases.id))
        .orderBy(desc(releaseHistories.createdAt))
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
    const [row] = await db
      .select()
      .from(releases)
      .leftJoin(products, eq(releases.productId, products.id))
      .leftJoin(users, eq(releases.userId, users.id))
      .leftJoin(workOrders, eq(releases.workOrderId, workOrders.id))
      .where(eq(releases.id, id));

    if (!row) return null;

    const histories = await db
      .select()
      .from(releaseHistories)
      .leftJoin(users, eq(releaseHistories.releaseManagerUserId, users.id))
      .where(eq(releaseHistories.releaseId, id))
      .orderBy(desc(releaseHistories.createdAt));

    const historiesWithUsers = [];
    for (const h of histories) {
      let approvedByUser = null;
      if (h.release_histories.approvedByUserId) {
        const [u] = await db.select().from(users).where(eq(users.id, h.release_histories.approvedByUserId));
        approvedByUser = u || null;
      }
      const items = await db
        .select()
        .from(releaseChecklistItems)
        .where(eq(releaseChecklistItems.releaseHistoryId, h.release_histories.id))
        .orderBy(asc(releaseChecklistItems.order));

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

  async createRelease(data: InsertRelease) {
    const release = await insertReturning(releases, data);

    if (release) {
      const historyData = {
        releaseId: release.id,
        releaseManagerUserId: data.userId || 1,
        status: "Created",
        environment: data.environment,
      };
      const history = await insertReturning(releaseHistories, historyData);

      if (history && data.productId) {
        await this.autoGenerateChecklistItems(history.id, data.productId, data.environment);
      }
    }

    return release;
  }

  async updateRelease(id: number, data: Partial<InsertRelease>) {
    const [existing] = await db.select().from(releases).where(eq(releases.id, id));
    if (!existing) return null;

    await db.update(releases).set({ ...data, updatedAt: new Date() }).where(eq(releases.id, id));

    if (data.environment && data.environment !== existing.environment) {
      const historyData = {
        releaseId: id,
        releaseManagerUserId: data.userId || existing.userId || 1,
        status: data.status || existing.status || "Created",
        environment: data.environment,
      };
      const history = await insertReturning(releaseHistories, historyData);
      if (history && (data.productId || existing.productId)) {
        await this.autoGenerateChecklistItems(
          history.id,
          (data.productId || existing.productId)!,
          data.environment
        );
      }
    }

    const [updated] = await db.select().from(releases).where(eq(releases.id, id));
    return updated;
  }

  async deleteRelease(id: number) {
    await db.delete(releaseChecklistItems).where(eq(releaseChecklistItems.releaseId, id));
    const hists = await db.select().from(releaseHistories).where(eq(releaseHistories.releaseId, id));
    for (const h of hists) {
      await db.delete(releaseChecklistItems).where(eq(releaseChecklistItems.releaseHistoryId, h.id));
    }
    await db.delete(releaseHistories).where(eq(releaseHistories.releaseId, id));
    await db.delete(releases).where(eq(releases.id, id));
  }

  async getReleaseHistories(releaseId: number) {
    const rows = await db
      .select()
      .from(releaseHistories)
      .leftJoin(users, eq(releaseHistories.releaseManagerUserId, users.id))
      .where(eq(releaseHistories.releaseId, releaseId))
      .orderBy(desc(releaseHistories.createdAt));

    const result = [];
    for (const r of rows) {
      let approvedByUser = null;
      if (r.release_histories.approvedByUserId) {
        const [u] = await db.select().from(users).where(eq(users.id, r.release_histories.approvedByUserId));
        approvedByUser = u || null;
      }
      const items = await db
        .select()
        .from(releaseChecklistItems)
        .where(eq(releaseChecklistItems.releaseHistoryId, r.release_histories.id))
        .orderBy(asc(releaseChecklistItems.order));

      result.push({
        ...r.release_histories,
        releaseManager: r.users,
        approvedByUser,
        checklistItems: items,
      });
    }
    return result;
  }

  async createReleaseHistory(data: InsertReleaseHistory) {
    const history = await insertReturning(releaseHistories, data);

    if (history) {
      const [release] = await db.select().from(releases).where(eq(releases.id, data.releaseId));
      if (release?.productId) {
        await this.autoGenerateChecklistItems(history.id, release.productId, data.environment);
      }
    }

    return history;
  }

  async updateReleaseHistory(id: number, data: Partial<InsertReleaseHistory>) {
    await db.update(releaseHistories).set({ ...data, updatedAt: new Date() }).where(eq(releaseHistories.id, id));
    const [updated] = await db.select().from(releaseHistories).where(eq(releaseHistories.id, id));
    return updated;
  }

  async deleteReleaseHistory(id: number) {
    await db.delete(releaseChecklistItems).where(eq(releaseChecklistItems.releaseHistoryId, id));
    await db.delete(releaseHistories).where(eq(releaseHistories.id, id));
  }

  async getChecklistItems(releaseHistoryId: number) {
    return db
      .select()
      .from(releaseChecklistItems)
      .where(eq(releaseChecklistItems.releaseHistoryId, releaseHistoryId))
      .orderBy(asc(releaseChecklistItems.order));
  }

  async updateChecklistItemState(id: number, done: boolean) {
    await db.update(releaseChecklistItems).set({ done, updatedAt: new Date() }).where(eq(releaseChecklistItems.id, id));
    const [updated] = await db.select().from(releaseChecklistItems).where(eq(releaseChecklistItems.id, id));
    return updated || null;
  }

  async getChecklistTemplates() {
    const templates = await db.select().from(releaseChecklistTemplates).orderBy(desc(releaseChecklistTemplates.createdAt));
    const result = [];
    for (const t of templates) {
      const items = await db
        .select()
        .from(releaseChecklistTemplateItems)
        .where(eq(releaseChecklistTemplateItems.releaseChecklistTemplateId, t.id))
        .orderBy(asc(releaseChecklistTemplateItems.order));
      result.push({ ...t, items });
    }
    return result;
  }

  async getChecklistTemplateById(id: number) {
    const [template] = await db.select().from(releaseChecklistTemplates).where(eq(releaseChecklistTemplates.id, id));
    if (!template) return null;
    const items = await db
      .select()
      .from(releaseChecklistTemplateItems)
      .where(eq(releaseChecklistTemplateItems.releaseChecklistTemplateId, id))
      .orderBy(asc(releaseChecklistTemplateItems.order));
    return { ...template, items };
  }

  async createChecklistTemplate(name: string) {
    return insertReturning(releaseChecklistTemplates, { name });
  }

  async updateChecklistTemplate(id: number, name: string) {
    await db.update(releaseChecklistTemplates).set({ name, updatedAt: new Date() }).where(eq(releaseChecklistTemplates.id, id));
    const [updated] = await db.select().from(releaseChecklistTemplates).where(eq(releaseChecklistTemplates.id, id));
    return updated;
  }

  async deleteChecklistTemplate(id: number) {
    await db.delete(releaseChecklistTemplateItems).where(eq(releaseChecklistTemplateItems.releaseChecklistTemplateId, id));
    await db.delete(releaseChecklistTemplates).where(eq(releaseChecklistTemplates.id, id));
  }

  async replaceChecklistTemplateItems(templateId: number, items: { text: string; order: number }[]) {
    await db.delete(releaseChecklistTemplateItems).where(eq(releaseChecklistTemplateItems.releaseChecklistTemplateId, templateId));
    if (items.length > 0) {
      await db.insert(releaseChecklistTemplateItems).values(
        items.map((item) => ({
          releaseChecklistTemplateId: templateId,
          text: item.text,
          order: item.order,
        }))
      );
    }
    return this.getChecklistTemplateById(templateId);
  }

  async getProducts() {
    return db.select().from(products).orderBy(asc(products.name));
  }

  async getUsers() {
    return db.select().from(users).orderBy(asc(users.name));
  }

  async getWorkOrdersByProduct(productId: number) {
    return db.select().from(workOrders).orderBy(asc(workOrders.title));
  }

  async autoGenerateChecklistItems(releaseHistoryId: number, productId: number, environment: string) {
    const [pe] = await db
      .select()
      .from(productEnvironments)
      .where(
        and(
          eq(productEnvironments.productId, productId),
          eq(productEnvironments.environment, environment)
        )
      );

    if (pe?.releaseChecklistTemplateId) {
      const templateItems = await db
        .select()
        .from(releaseChecklistTemplateItems)
        .where(eq(releaseChecklistTemplateItems.releaseChecklistTemplateId, pe.releaseChecklistTemplateId))
        .orderBy(asc(releaseChecklistTemplateItems.order));

      if (templateItems.length > 0) {
        await db.insert(releaseChecklistItems).values(
          templateItems.map((item) => ({
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

export const storage = new MySQLStorage();
