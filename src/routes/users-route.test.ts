import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { usersRoute } from "./users-route";
import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

const app = new Elysia().use(usersRoute);

describe("User API", () => {
  const email = `test-${crypto.randomUUID()}@example.com`;
  const password = "password123";
  const name = "Test User";
  let token = "";

  beforeAll(async () => {
    // Clean up potential leftover user
    const userList = await db.select().from(users).where(eq(users.email, email));
    if (userList.length > 0) {
      const userId = userList[0].id;
      await db.delete(sessions).where(eq(sessions.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  afterAll(async () => {
    // Clean up created user and sessions
    const userList = await db.select().from(users).where(eq(users.email, email));
    if (userList.length > 0) {
      const userId = userList[0].id;
      await db.delete(sessions).where(eq(sessions.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  it("should register a new user", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({ data: "OK" });
  });

  it("should login the user and return a token", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toBeDefined();
    token = body.data;
  });

  it("should get current user with valid token", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: { authorization: `Bearer ${token}` },
      })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.email).toBe(email);
    expect(body.data.name).toBe(name);
  });

  it("should logout successfully with valid token", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ data: "OK" });
  });

  it("should not get current user after logout", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: { authorization: `Bearer ${token}` },
      })
    );
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "unauthorized" });
  });

  it("should not logout with an invalid token", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: { authorization: `Bearer invalidtoken` },
      })
    );
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "unauthorized" });
  });
});
