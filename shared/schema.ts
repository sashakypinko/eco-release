import { sql, relations } from "drizzle-orm";
import {
  mysqlTable,
  text,
  varchar,
  timestamp,
  boolean,
  bigint,
  int,
  serial,
  date,
  datetime,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
});

export const products = mysqlTable("products", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  slackChannelId: varchar("slack_channel_id", { length: 255 }),
});

export const workOrders = mysqlTable("work_orders", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }),
});

export const releases = mysqlTable("releases", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  version: varchar("version", { length: 255 }).notNull(),
  description: varchar("description", { length: 255 }),
  environment: varchar("environment", { length: 255 }).notNull().default("prod"),
  projectJiraIssue: varchar("project_jira_issue", { length: 255 }),
  customerContact: varchar("customer_contact", { length: 255 }),
  plannedReleaseDate: date("planned_release_date"),
  status: varchar("status", { length: 255 }),
  productId: bigint("product_id", { mode: "number", unsigned: true }),
  workOrderId: bigint("work_order_id", { mode: "number", unsigned: true }),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  slackNotificationTimestamp: varchar("slack_notification_timestamp", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const releaseHistories = mysqlTable("release_histories", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  releaseId: int("release_id", { unsigned: true }).notNull(),
  approvedByUserId: bigint("approved_by_user_id", { mode: "number", unsigned: true }),
  dateOfApproval: datetime("date_of_approval"),
  comment: text("comment"),
  releaseManagerUserId: bigint("release_manager_user_id", { mode: "number", unsigned: true }).notNull(),
  status: varchar("status", { length: 255 }).notNull(),
  environment: varchar("environment", { length: 255 }).notNull(),
  server: varchar("server", { length: 255 }),
  port: int("port"),
  releaseDate: datetime("release_date"),
  releaseNotes: varchar("release_notes", { length: 255 }),
  releaseVideo: varchar("release_video", { length: 255 }),
  smokeTestDate: datetime("smoke_test_date"),
  smokeTestResult: varchar("smoke_test_result", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const releaseChecklistItems = mysqlTable("release_checklist_items", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  releaseHistoryId: bigint("release_history_id", { mode: "number", unsigned: true }),
  releaseId: bigint("release_id", { mode: "number", unsigned: true }),
  text: varchar("text", { length: 255 }).notNull(),
  order: int("order").notNull(),
  done: boolean("done").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const releaseChecklistTemplates = mysqlTable("release_checklist_templates", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const releaseChecklistTemplateItems = mysqlTable("release_checklist_template_items", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  releaseChecklistTemplateId: bigint("release_checklist_template_id", { mode: "number", unsigned: true }).notNull(),
  text: varchar("text", { length: 255 }).notNull(),
  order: int("order").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const productEnvironments = mysqlTable("product_environments", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  productId: bigint("product_id", { mode: "number", unsigned: true }).notNull(),
  environment: varchar("environment", { length: 255 }).notNull(),
  releaseChecklistTemplateId: bigint("release_checklist_template_id", { mode: "number", unsigned: true }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const releasesRelations = relations(releases, ({ one, many }) => ({
  product: one(products, { fields: [releases.productId], references: [products.id] }),
  workOrder: one(workOrders, { fields: [releases.workOrderId], references: [workOrders.id] }),
  user: one(users, { fields: [releases.userId], references: [users.id] }),
  histories: many(releaseHistories),
}));

export const releaseHistoriesRelations = relations(releaseHistories, ({ one, many }) => ({
  release: one(releases, { fields: [releaseHistories.releaseId], references: [releases.id] }),
  approvedByUser: one(users, { fields: [releaseHistories.approvedByUserId], references: [users.id], relationName: "approvedBy" }),
  releaseManager: one(users, { fields: [releaseHistories.releaseManagerUserId], references: [users.id], relationName: "releaseManager" }),
  checklistItems: many(releaseChecklistItems),
}));

export const releaseChecklistItemsRelations = relations(releaseChecklistItems, ({ one }) => ({
  releaseHistory: one(releaseHistories, { fields: [releaseChecklistItems.releaseHistoryId], references: [releaseHistories.id] }),
}));

export const releaseChecklistTemplatesRelations = relations(releaseChecklistTemplates, ({ many }) => ({
  items: many(releaseChecklistTemplateItems),
}));

export const releaseChecklistTemplateItemsRelations = relations(releaseChecklistTemplateItems, ({ one }) => ({
  template: one(releaseChecklistTemplates, { fields: [releaseChecklistTemplateItems.releaseChecklistTemplateId], references: [releaseChecklistTemplates.id] }),
}));

export const productEnvironmentsRelations = relations(productEnvironments, ({ one }) => ({
  product: one(products, { fields: [productEnvironments.productId], references: [products.id] }),
  releaseChecklistTemplate: one(releaseChecklistTemplates, { fields: [productEnvironments.releaseChecklistTemplateId], references: [releaseChecklistTemplates.id] }),
}));

export const insertReleaseSchema = createInsertSchema(releases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  slackNotificationTimestamp: true,
});

export const insertReleaseHistorySchema = createInsertSchema(releaseHistories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReleaseChecklistTemplateSchema = createInsertSchema(releaseChecklistTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Release = typeof releases.$inferSelect;
export type InsertRelease = z.infer<typeof insertReleaseSchema>;
export type ReleaseHistory = typeof releaseHistories.$inferSelect;
export type InsertReleaseHistory = z.infer<typeof insertReleaseHistorySchema>;
export type ReleaseChecklistItem = typeof releaseChecklistItems.$inferSelect;
export type ReleaseChecklistTemplate = typeof releaseChecklistTemplates.$inferSelect;
export type ReleaseChecklistTemplateItem = typeof releaseChecklistTemplateItems.$inferSelect;
export type InsertReleaseChecklistTemplate = z.infer<typeof insertReleaseChecklistTemplateSchema>;
export type Product = typeof products.$inferSelect;
export type User = typeof users.$inferSelect;
export type WorkOrder = typeof workOrders.$inferSelect;
export type ProductEnvironment = typeof productEnvironments.$inferSelect;
