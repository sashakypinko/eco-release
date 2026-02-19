"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var schema_exports = {};
__export(schema_exports, {
  insertReleaseChecklistTemplateSchema: () => insertReleaseChecklistTemplateSchema,
  insertReleaseHistorySchema: () => insertReleaseHistorySchema,
  insertReleaseSchema: () => insertReleaseSchema,
  productEnvironments: () => productEnvironments,
  productEnvironmentsRelations: () => productEnvironmentsRelations,
  products: () => products,
  releaseChecklistItems: () => releaseChecklistItems,
  releaseChecklistItemsRelations: () => releaseChecklistItemsRelations,
  releaseChecklistTemplateItems: () => releaseChecklistTemplateItems,
  releaseChecklistTemplateItemsRelations: () => releaseChecklistTemplateItemsRelations,
  releaseChecklistTemplates: () => releaseChecklistTemplates,
  releaseChecklistTemplatesRelations: () => releaseChecklistTemplatesRelations,
  releaseHistories: () => releaseHistories,
  releaseHistoriesRelations: () => releaseHistoriesRelations,
  releases: () => releases,
  releasesRelations: () => releasesRelations,
  users: () => users,
  workOrders: () => workOrders
});
module.exports = __toCommonJS(schema_exports);
var import_drizzle_orm = require("drizzle-orm");
var import_mysql_core = require("drizzle-orm/mysql-core");
var import_drizzle_zod = require("drizzle-zod");
const users = (0, import_mysql_core.mysqlTable)("users", {
  id: (0, import_mysql_core.bigint)("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  name: (0, import_mysql_core.varchar)("name", { length: 255 }).notNull(),
  email: (0, import_mysql_core.varchar)("email", { length: 255 }).notNull()
});
const products = (0, import_mysql_core.mysqlTable)("products", {
  id: (0, import_mysql_core.bigint)("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  name: (0, import_mysql_core.varchar)("name", { length: 255 }).notNull(),
  slackChannelId: (0, import_mysql_core.varchar)("slack_channel_id", { length: 255 })
});
const workOrders = (0, import_mysql_core.mysqlTable)("work_orders", {
  id: (0, import_mysql_core.bigint)("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  title: (0, import_mysql_core.varchar)("title", { length: 255 })
});
const releases = (0, import_mysql_core.mysqlTable)("releases", {
  id: (0, import_mysql_core.bigint)("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  version: (0, import_mysql_core.varchar)("version", { length: 255 }).notNull(),
  description: (0, import_mysql_core.varchar)("description", { length: 255 }),
  environment: (0, import_mysql_core.varchar)("environment", { length: 255 }).notNull().default("prod"),
  projectJiraIssue: (0, import_mysql_core.varchar)("project_jira_issue", { length: 255 }),
  customerContact: (0, import_mysql_core.varchar)("customer_contact", { length: 255 }),
  plannedReleaseDate: (0, import_mysql_core.date)("planned_release_date"),
  status: (0, import_mysql_core.varchar)("status", { length: 255 }),
  productId: (0, import_mysql_core.bigint)("product_id", { mode: "number", unsigned: true }),
  workOrderId: (0, import_mysql_core.bigint)("work_order_id", { mode: "number", unsigned: true }),
  userId: (0, import_mysql_core.bigint)("user_id", { mode: "number", unsigned: true }),
  slackNotificationTimestamp: (0, import_mysql_core.varchar)("slack_notification_timestamp", { length: 255 }),
  createdAt: (0, import_mysql_core.timestamp)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`),
  updatedAt: (0, import_mysql_core.timestamp)("updated_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
});
const releaseHistories = (0, import_mysql_core.mysqlTable)("release_histories", {
  id: (0, import_mysql_core.bigint)("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  releaseId: (0, import_mysql_core.int)("release_id", { unsigned: true }).notNull(),
  approvedByUserId: (0, import_mysql_core.bigint)("approved_by_user_id", { mode: "number", unsigned: true }),
  dateOfApproval: (0, import_mysql_core.datetime)("date_of_approval"),
  comment: (0, import_mysql_core.text)("comment"),
  releaseManagerUserId: (0, import_mysql_core.bigint)("release_manager_user_id", { mode: "number", unsigned: true }).notNull(),
  status: (0, import_mysql_core.varchar)("status", { length: 255 }).notNull(),
  environment: (0, import_mysql_core.varchar)("environment", { length: 255 }).notNull(),
  server: (0, import_mysql_core.varchar)("server", { length: 255 }),
  port: (0, import_mysql_core.int)("port"),
  releaseDate: (0, import_mysql_core.datetime)("release_date"),
  releaseNotes: (0, import_mysql_core.varchar)("release_notes", { length: 255 }),
  releaseVideo: (0, import_mysql_core.varchar)("release_video", { length: 255 }),
  smokeTestDate: (0, import_mysql_core.datetime)("smoke_test_date"),
  smokeTestResult: (0, import_mysql_core.varchar)("smoke_test_result", { length: 255 }),
  createdAt: (0, import_mysql_core.timestamp)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`),
  updatedAt: (0, import_mysql_core.timestamp)("updated_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
});
const releaseChecklistItems = (0, import_mysql_core.mysqlTable)("release_checklist_items", {
  id: (0, import_mysql_core.bigint)("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  releaseHistoryId: (0, import_mysql_core.bigint)("release_history_id", { mode: "number", unsigned: true }),
  releaseId: (0, import_mysql_core.bigint)("release_id", { mode: "number", unsigned: true }),
  text: (0, import_mysql_core.varchar)("text", { length: 255 }).notNull(),
  order: (0, import_mysql_core.int)("order").notNull(),
  done: (0, import_mysql_core.boolean)("done").notNull().default(false),
  createdAt: (0, import_mysql_core.timestamp)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`),
  updatedAt: (0, import_mysql_core.timestamp)("updated_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
});
const releaseChecklistTemplates = (0, import_mysql_core.mysqlTable)("release_checklist_templates", {
  id: (0, import_mysql_core.bigint)("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  name: (0, import_mysql_core.varchar)("name", { length: 255 }).notNull(),
  createdAt: (0, import_mysql_core.timestamp)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`),
  updatedAt: (0, import_mysql_core.timestamp)("updated_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
});
const releaseChecklistTemplateItems = (0, import_mysql_core.mysqlTable)("release_checklist_template_items", {
  id: (0, import_mysql_core.bigint)("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  releaseChecklistTemplateId: (0, import_mysql_core.bigint)("release_checklist_template_id", { mode: "number", unsigned: true }).notNull(),
  text: (0, import_mysql_core.varchar)("text", { length: 255 }).notNull(),
  order: (0, import_mysql_core.int)("order").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`),
  updatedAt: (0, import_mysql_core.timestamp)("updated_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
});
const productEnvironments = (0, import_mysql_core.mysqlTable)("product_environments", {
  id: (0, import_mysql_core.bigint)("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  productId: (0, import_mysql_core.bigint)("product_id", { mode: "number", unsigned: true }).notNull(),
  environment: (0, import_mysql_core.varchar)("environment", { length: 255 }).notNull(),
  releaseChecklistTemplateId: (0, import_mysql_core.bigint)("release_checklist_template_id", { mode: "number", unsigned: true }),
  createdAt: (0, import_mysql_core.timestamp)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`),
  updatedAt: (0, import_mysql_core.timestamp)("updated_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
});
const releasesRelations = (0, import_drizzle_orm.relations)(releases, ({ one, many }) => ({
  product: one(products, { fields: [releases.productId], references: [products.id] }),
  workOrder: one(workOrders, { fields: [releases.workOrderId], references: [workOrders.id] }),
  user: one(users, { fields: [releases.userId], references: [users.id] }),
  histories: many(releaseHistories)
}));
const releaseHistoriesRelations = (0, import_drizzle_orm.relations)(releaseHistories, ({ one, many }) => ({
  release: one(releases, { fields: [releaseHistories.releaseId], references: [releases.id] }),
  approvedByUser: one(users, { fields: [releaseHistories.approvedByUserId], references: [users.id], relationName: "approvedBy" }),
  releaseManager: one(users, { fields: [releaseHistories.releaseManagerUserId], references: [users.id], relationName: "releaseManager" }),
  checklistItems: many(releaseChecklistItems)
}));
const releaseChecklistItemsRelations = (0, import_drizzle_orm.relations)(releaseChecklistItems, ({ one }) => ({
  releaseHistory: one(releaseHistories, { fields: [releaseChecklistItems.releaseHistoryId], references: [releaseHistories.id] })
}));
const releaseChecklistTemplatesRelations = (0, import_drizzle_orm.relations)(releaseChecklistTemplates, ({ many }) => ({
  items: many(releaseChecklistTemplateItems)
}));
const releaseChecklistTemplateItemsRelations = (0, import_drizzle_orm.relations)(releaseChecklistTemplateItems, ({ one }) => ({
  template: one(releaseChecklistTemplates, { fields: [releaseChecklistTemplateItems.releaseChecklistTemplateId], references: [releaseChecklistTemplates.id] })
}));
const productEnvironmentsRelations = (0, import_drizzle_orm.relations)(productEnvironments, ({ one }) => ({
  product: one(products, { fields: [productEnvironments.productId], references: [products.id] }),
  releaseChecklistTemplate: one(releaseChecklistTemplates, { fields: [productEnvironments.releaseChecklistTemplateId], references: [releaseChecklistTemplates.id] })
}));
const insertReleaseSchema = (0, import_drizzle_zod.createInsertSchema)(releases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  slackNotificationTimestamp: true
});
const insertReleaseHistorySchema = (0, import_drizzle_zod.createInsertSchema)(releaseHistories).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
const insertReleaseChecklistTemplateSchema = (0, import_drizzle_zod.createInsertSchema)(releaseChecklistTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  insertReleaseChecklistTemplateSchema,
  insertReleaseHistorySchema,
  insertReleaseSchema,
  productEnvironments,
  productEnvironmentsRelations,
  products,
  releaseChecklistItems,
  releaseChecklistItemsRelations,
  releaseChecklistTemplateItems,
  releaseChecklistTemplateItemsRelations,
  releaseChecklistTemplates,
  releaseChecklistTemplatesRelations,
  releaseHistories,
  releaseHistoriesRelations,
  releases,
  releasesRelations,
  users,
  workOrders
});
