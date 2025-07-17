// server/routes.ts
// Defines all API endpoints for inventory, issuance, and audit operations.
// All routes are protected by authentication middleware.

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertIssuanceSchema, insertAuditSchema, insertItemSchema } from "@shared/schema";
import { z } from "zod";

// Schema for updating item count
const updateCountSchema = z.object({
  count: z.number().min(0),
  reason: z.string().optional(),
});

/**
 * Registers all API routes and authentication to the Express app.
 * @param app Express app instance
 * @returns HTTP server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // --- Inventory Routes ---

  /**
   * GET /api/items
   * Returns all inventory items. Requires authentication.
   */
  app.get("/api/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const items = await storage.getItems();
    res.json(items);
  });

  /**
   * POST /api/items
   * Creates a new inventory item. Requires authentication.
   * Body: { name, category, subCategory, count, ... }
   */
  app.post("/api/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const itemData = insertItemSchema.parse(req.body);
    const item = await storage.createItem(itemData);

    // Create audit entry
    await storage.createAudit({
      userId: req.user.id,
      action: "CREATE",
      details: `Created new item: ${item.name}`,
    });

    res.status(201).json(item);
  });

  /**
   * PATCH /api/items/:id
   * Updates an existing inventory item. Requires authentication.
   * Body: { name, category, subCategory, count, ... }
   */
  app.patch("/api/items/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const itemData = insertItemSchema.parse(req.body);
    const oldItem = await storage.getItem(parseInt(req.params.id));

    if (!oldItem) {
      return res.status(404).send("Item not found");
    }

    const item = await storage.updateItem(oldItem.id, itemData);

    // Create audit entry
    await storage.createAudit({
      userId: req.user.id,
      action: "UPDATE",
      details: `Updated item: ${item.name}`,
    });

    res.json(item);
  });

  /**
   * DELETE /api/items/:id
   * Deletes an inventory item. Requires authentication.
   */
  app.delete("/api/items/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const item = await storage.getItem(parseInt(req.params.id));

    if (!item) {
      return res.status(404).send("Item not found");
    }

    await storage.deleteItem(item.id);

    // Create audit entry
    await storage.createAudit({
      userId: req.user.id,
      action: "DELETE",
      details: `Deleted item: ${item.name}`,
    });

    res.sendStatus(200);
  });

  /**
   * PATCH /api/items/:id/count
   * Updates the count of an item, with optional reason for discrepancy. Requires authentication.
   * Body: { count, reason? }
   */
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

  // --- Issuance Routes ---

  /**
   * POST /api/issuances
   * Issues an item to a user. Requires authentication.
   * Body: { itemId, quantity, recipientDepartment, ... }
   */
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

  /**
   * GET /api/issuances
   * Returns all issuance records. Requires authentication.
   */
  app.get("/api/issuances", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const issuances = await storage.getIssuances();
    res.json(issuances);
  });

  /**
   * POST /api/issuances/:id/return
   * Marks an issuance as returned. Requires authentication.
   */
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

  // --- Audit Routes ---

  /**
   * GET /api/audits
   * Returns all audit logs. Requires authentication.
   */
  app.get("/api/audits", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const audits = await storage.getAudits();
    res.json(audits);
  });

  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}