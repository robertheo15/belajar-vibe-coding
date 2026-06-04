import { db } from "../db";
import { users, sessions } from "../db/schema";
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

export const loginUser = async (payload: Pick<typeof users.$inferInsert, "email" | "password">) => {
  // Cari user berdasarkan email
  const [user] = await db.select().from(users).where(eq(users.email, payload.email));
  
  if (!user) {
    throw new Error("email atau password salah");
  }

  // Bandingkan password
  const isPasswordValid = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordValid) {
    throw new Error("email atau password salah");
  }

  // Buat session token
  const token = crypto.randomUUID();

  // Simpan ke database
  await db.insert(sessions).values({
    token: token,
    userId: user.id,
  });

  return token;
};
