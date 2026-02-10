import { Injectable, Inject } from '@nestjs/common';
import { eq, desc, asc } from 'drizzle-orm';
import type { Database } from '../database/database.module';
import { insertReturning } from '../database/db.util';

const schema = require('../../../shared/schema');

@Injectable()
export class ChecklistService {
  constructor(@Inject('DATABASE') private db: Database) {}

  async updateChecklistItemState(id: number, done: boolean) {
    await (this.db as any).update(schema.releaseChecklistItems).set({ done, updatedAt: new Date() }).where(eq(schema.releaseChecklistItems.id, id));
    const [updated] = await (this.db as any).select().from(schema.releaseChecklistItems).where(eq(schema.releaseChecklistItems.id, id));
    return updated || null;
  }

  async getTemplates() {
    const templates = await (this.db as any).select().from(schema.releaseChecklistTemplates).orderBy(desc(schema.releaseChecklistTemplates.createdAt));
    const result: any[] = [];
    for (const t of templates) {
      const items = await (this.db as any)
        .select()
        .from(schema.releaseChecklistTemplateItems)
        .where(eq(schema.releaseChecklistTemplateItems.releaseChecklistTemplateId, t.id))
        .orderBy(asc(schema.releaseChecklistTemplateItems.order));
      result.push({ ...t, items });
    }
    return result;
  }

  async getTemplateById(id: number) {
    const [template] = await (this.db as any).select().from(schema.releaseChecklistTemplates).where(eq(schema.releaseChecklistTemplates.id, id));
    if (!template) return null;
    const items = await (this.db as any)
      .select()
      .from(schema.releaseChecklistTemplateItems)
      .where(eq(schema.releaseChecklistTemplateItems.releaseChecklistTemplateId, id))
      .orderBy(asc(schema.releaseChecklistTemplateItems.order));
    return { ...template, items };
  }

  async createTemplate(name: string) {
    return insertReturning(this.db, schema.releaseChecklistTemplates, { name });
  }

  async updateTemplate(id: number, name: string) {
    await (this.db as any).update(schema.releaseChecklistTemplates).set({ name, updatedAt: new Date() }).where(eq(schema.releaseChecklistTemplates.id, id));
    const [updated] = await (this.db as any).select().from(schema.releaseChecklistTemplates).where(eq(schema.releaseChecklistTemplates.id, id));
    return updated;
  }

  async deleteTemplate(id: number) {
    await (this.db as any).delete(schema.releaseChecklistTemplateItems).where(eq(schema.releaseChecklistTemplateItems.releaseChecklistTemplateId, id));
    await (this.db as any).delete(schema.releaseChecklistTemplates).where(eq(schema.releaseChecklistTemplates.id, id));
  }

  async replaceTemplateItems(templateId: number, items: { text: string; order: number }[]) {
    await (this.db as any).delete(schema.releaseChecklistTemplateItems).where(eq(schema.releaseChecklistTemplateItems.releaseChecklistTemplateId, templateId));
    if (items.length > 0) {
      await (this.db as any).insert(schema.releaseChecklistTemplateItems).values(
        items.map((item) => ({
          releaseChecklistTemplateId: templateId,
          text: item.text,
          order: item.order,
        }))
      );
    }
    return this.getTemplateById(templateId);
  }
}
