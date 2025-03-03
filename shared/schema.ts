import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema from auth blueprint
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("issuer"),
  department: text("department").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  department: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Inventory schema
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  subCategory: text("subCategory"),
  count: integer("count").notNull(),
  lastUpdated: timestamp("lastUpdated").notNull(),
  image: jsonb("image"),
});

export const insertItemSchema = createInsertSchema(items).pick({
  name: true,
  category: true,
  subCategory: true,
  count: true,
  image: true,
});

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

// Issuance schema
export const issuances = pgTable("issuances", {
  id: serial("id").primaryKey(),
  itemId: integer("itemId").notNull(),
  issuerId: integer("issuerId").notNull(),
  authorizedById: integer("authorizedById").notNull(),
  quantity: integer("quantity").notNull(),
  status: text("status").notNull(), // Permanent or Temporary
  issueDate: timestamp("issueDate").notNull(),
  returnDate: timestamp("returnDate"), // Optional for temporary issuances
  returnedDate: timestamp("returnedDate"), // Filled when item is returned
  recipientDepartment: text("recipientDepartment").notNull(),
});

export const insertIssuanceSchema = createInsertSchema(issuances).pick({
  itemId: true,
  authorizedById: true,
  quantity: true,
  status: true,
  issueDate: true,
  returnDate: true,
  recipientDepartment: true,
});

export type InsertIssuance = z.infer<typeof insertIssuanceSchema>;
export type Issuance = typeof issuances.$inferSelect;

// Audit schema
export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  action: text("action").notNull(),
  details: text("details").notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

export const insertAuditSchema = createInsertSchema(audits).pick({
  userId: true,
  action: true,
  details: true,
});

export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type Audit = typeof audits.$inferSelect;