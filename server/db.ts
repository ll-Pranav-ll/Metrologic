import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { inspections, InsertInspection, InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function getConnectionString() {
  return process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;
}

export async function getDb() {
  if (!_db) {
    const connectionString = getConnectionString();
    if (!connectionString || !connectionString.startsWith("postgres")) return null;
    try {
      _pool = new Pool({ connectionString, max: 2, ssl: { rejectUnauthorized: false } });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to initialize PostgreSQL:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  updateSet.updatedAt = new Date();
  updateSet.lastSignedIn ??= new Date();
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listInspections() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inspections).orderBy(desc(inspections.createdAt));
}

export async function getInspectionById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inspections).where(eq(inspections.id, id)).limit(1);
  return result[0];
}

export async function createInspection(record: InsertInspection) {
  const db = await getDb();
  if (!db) throw new Error("Inspection storage is not available.");
  await db.insert(inspections).values(record);
  return getInspectionById(record.id);
}

export async function updateInspection(id: string, updates: Partial<InsertInspection>) {
  const db = await getDb();
  if (!db) throw new Error("Inspection storage is not available.");
  await db.update(inspections).set({ ...updates, updatedAt: new Date() }).where(eq(inspections.id, id));
  return getInspectionById(id);
}
