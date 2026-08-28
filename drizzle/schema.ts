import { integer, jsonb, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable("users", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRole("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const inspections = pgTable("inspections", {
  id: varchar("id", { length: 64 }).primaryKey(),
  brand: varchar("brand", { length: 255 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  complianceScore: integer("complianceScore").notNull(),
  inspectorNotes: text("inspectorNotes"),
  extractedData: jsonb("extractedData").notNull(),
  evaluation: jsonb("evaluation").notNull(),
  evidence: jsonb("evidence").notNull(),
  regionFlags: jsonb("regionFlags").notNull(),
  reportKey: varchar("reportKey", { length: 512 }),
  reportUrl: varchar("reportUrl", { length: 1024 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;
