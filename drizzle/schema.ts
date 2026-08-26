import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Inspection metadata persists structured extraction and evaluation data. Package
 * images and generated report bytes live in object storage; only their keys and
 * serving URLs are retained here.
 */
export const inspections = mysqlTable("inspections", {
  id: varchar("id", { length: 64 }).primaryKey(),
  brand: varchar("brand", { length: 255 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  complianceScore: int("complianceScore").notNull(),
  inspectorNotes: text("inspectorNotes"),
  extractedData: json("extractedData").notNull(),
  evaluation: json("evaluation").notNull(),
  evidence: json("evidence").notNull(),
  regionFlags: json("regionFlags").notNull(),
  reportKey: varchar("reportKey", { length: 512 }),
  reportUrl: varchar("reportUrl", { length: 1024 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;
