import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertIssuanceSchema, insertAuditSchema } from "@shared/schema";
import { z } from "zod";

const updateCountSchema = z.object({
  count: z.number().min(0),
  reason: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Inventory routes
  app.get("/api/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const items = await storage.getItems();
    res.json(items);
  });

  app.patch("/api/items/:id/count", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { count, reason } = updateCountSchema.parse(req.body);
    const item = await storage.getItem(parseInt(req.params.id));

    if (!item) {
      return res.status(404).send("Item not found");
    }

    const updatedItem = await storage.updateItemCount(item.id, count);

    // Create audit entry
    await storage.createAudit({
      userId: req.user.id,
      action: "UPDATE",
      details: reason
        ? `Count updated from ${item.count} to ${count}. Reason: ${reason}`
        : `Count updated from ${item.count} to ${count}`
    });

    res.json(updatedItem);
  });

  // Issuance routes
  app.post("/api/issuances", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const issuanceData = insertIssuanceSchema.parse({
      ...req.body,
      issuerId: req.user.id,
    });

    const issuance = await storage.createIssuance(issuanceData);

    // Update item count
    const item = await storage.getItem(issuanceData.itemId);
    if (!item) return res.status(404).send("Item not found");

    await storage.updateItemCount(item.id, item.count - issuanceData.quantity);

    // Create audit entry
    await storage.createAudit({
      userId: req.user.id,
      action: "ISSUE",
      details: `Issued ${issuanceData.quantity} ${item.name}(s)`,
    });

    res.status(201).json(issuance);
  });

  app.get("/api/issuances", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const issuances = await storage.getIssuances();
    res.json(issuances);
  });

  app.post("/api/issuances/:id/return", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const issuance = await storage.updateIssuance(
      parseInt(req.params.id),
      new Date()
    );

    // Update item count
    const item = await storage.getItem(issuance.itemId);
    if (!item) return res.status(404).send("Item not found");

    await storage.updateItemCount(item.id, item.count + issuance.quantity);

    // Create audit entry
    await storage.createAudit({
      userId: req.user.id,
      action: "RETURN",
      details: `Returned ${issuance.quantity} ${item.name}(s)`,
    });

    res.json(issuance);
  });

  // Audit routes
  app.get("/api/audits", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const audits = await storage.getAudits();
    res.json(audits);
  });

  const httpServer = createServer(app);
  return httpServer;
}