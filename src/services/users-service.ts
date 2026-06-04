import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";

export const registerUser = async (payload: typeof users.$inferInsert) => {
  // Cek apakah email sudah terdaftar
  const existingUsers = await db.select().from(users).where(eq(users.email, payload.email));
  
  if (existingUsers.length > 0) {
    throw new Error("email sudah terdaftar");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  // Simpan ke database
  await db.insert(users).values({
    name: payload.name,
    email: payload.email,
    password: hashedPassword,
  });

  return "OK";
};
