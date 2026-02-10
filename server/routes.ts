import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { testConnection } from "./db";
import { insertReleaseSchema, insertReleaseHistorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await testConnection();

  app.get("/api/releases", async (req, res) => {
    try {
      const filters = {
        productId: req.query.product_id ? Number(req.query.product_id) : undefined,
        userId: req.query.user_id ? Number(req.query.user_id) : undefined,
        status: req.query.status as string | undefined,
        search: req.query.search as string | undefined,
        dateFrom: req.query.date_from as string | undefined,
        dateTo: req.query.date_to as string | undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        pageSize: req.query.page_size ? Number(req.query.page_size) : 25,
      };
      const result = await storage.getReleases(filters);
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching releases:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/releases/:id", async (req, res) => {
    try {
      const release = await storage.getReleaseById(Number(req.params.id));
      if (!release) return res.status(404).json({ message: "Release not found" });
      res.json({ release });
    } catch (error: any) {
      console.error("Error fetching release:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/releases", async (req, res) => {
    try {
      const parsed = insertReleaseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues.map(i => i.message).join(", ") });
      }
      const release = await storage.createRelease(parsed.data);
      res.status(201).json({ release });
    } catch (error: any) {
      console.error("Error creating release:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/releases/:id", async (req, res) => {
    try {
      const parsed = insertReleaseSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues.map(i => i.message).join(", ") });
      }
      const release = await storage.updateRelease(Number(req.params.id), parsed.data);
      if (!release) return res.status(404).json({ message: "Release not found" });
      res.json({ release });
    } catch (error: any) {
      console.error("Error updating release:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/releases/:id", async (req, res) => {
    try {
      await storage.deleteRelease(Number(req.params.id));
      res.json({ message: "Release deleted" });
    } catch (error: any) {
      console.error("Error deleting release:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/releases/:id/histories", async (req, res) => {
    try {
      const histories = await storage.getReleaseHistories(Number(req.params.id));
      res.json(histories);
    } catch (error: any) {
      console.error("Error fetching histories:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/release-histories", async (req, res) => {
    try {
      const parsed = insertReleaseHistorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues.map(i => i.message).join(", ") });
      }
      const history = await storage.createReleaseHistory(parsed.data);
      res.status(201).json({ history });
    } catch (error: any) {
      console.error("Error creating history:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/release-histories/:id", async (req, res) => {
    try {
      const parsed = insertReleaseHistorySchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues.map(i => i.message).join(", ") });
      }
      const history = await storage.updateReleaseHistory(Number(req.params.id), parsed.data);
      if (!history) return res.status(404).json({ message: "History not found" });
      res.json({ history });
    } catch (error: any) {
      console.error("Error updating history:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/release-histories/:id", async (req, res) => {
    try {
      await storage.deleteReleaseHistory(Number(req.params.id));
      res.json({ message: "History deleted" });
    } catch (error: any) {
      console.error("Error deleting history:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/releases/update-checklist-item-state", async (req, res) => {
    try {
      const { id, done } = req.body;
      if (typeof id !== "number" || typeof done !== "boolean") {
        return res.status(400).json({ message: "Invalid request body. Requires id (number) and done (boolean)." });
      }
      const item = await storage.updateChecklistItemState(id, done);
      if (!item) return res.status(404).json({ message: "Checklist item not found" });
      res.json({ item });
    } catch (error: any) {
      console.error("Error updating checklist item:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/checklist-templates", async (_req, res) => {
    try {
      const templates = await storage.getChecklistTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/checklist-templates/:id", async (req, res) => {
    try {
      const template = await storage.getChecklistTemplateById(Number(req.params.id));
      if (!template) return res.status(404).json({ message: "Template not found" });
      res.json({ template });
    } catch (error: any) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/checklist-templates", async (req, res) => {
    try {
      const template = await storage.createChecklistTemplate(req.body.name);
      res.status(201).json({ template });
    } catch (error: any) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/checklist-templates/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (req.body.items) {
        const template = await storage.replaceChecklistTemplateItems(id, req.body.items);
        if (!template) return res.status(404).json({ message: "Template not found" });
        return res.json({ template });
      }
      if (req.body.name) {
        const template = await storage.updateChecklistTemplate(id, req.body.name);
        if (!template) return res.status(404).json({ message: "Template not found" });
        return res.json({ template });
      }
      res.status(400).json({ message: "No valid update data provided" });
    } catch (error: any) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/checklist-templates/:id", async (req, res) => {
    try {
      await storage.deleteChecklistTemplate(Number(req.params.id));
      res.json({ message: "Template deleted" });
    } catch (error: any) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products", async (_req, res) => {
    try {
      const result = await storage.getProducts();
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users", async (_req, res) => {
    try {
      const result = await storage.getUsers();
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/work-orders", async (req, res) => {
    try {
      const productId = req.query.product_id ? Number(req.query.product_id) : 0;
      const result = await storage.getWorkOrdersByProduct(productId);
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching work orders:", error);
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
