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

export const getCurrentUser = async (token: string) => {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  const sessionUser = result[0];
  if (!sessionUser) {
    throw new Error("unauthorized");
  }

  return {
    id: sessionUser.id,
    name: sessionUser.name,
    email: sessionUser.email,
    created_at: sessionUser.createdAt,
  };
};

export const logout = async (token: string) => {
  const [result] = await db.delete(sessions).where(eq(sessions.token, token));
  if (result.affectedRows === 0) {
    throw new Error("unauthorized");
  }

  return "OK";
};

