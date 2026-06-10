import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/index";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";

// Helper function to clear database
async function clearDatabase() {
  await db.delete(sessions);
  await db.delete(users);
}

describe("API Endpoints", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  // 1. Health Check API (GET /)
  describe("Health Check API (GET /)", () => {
    it("should return 200 OK with correct status and message", async () => {
      const response = await app.handle(
        new Request("http://localhost/")
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        status: "ok",
        message: "Welcome to Elysia + Drizzle + MySQL API"
      });
    });
  });

  // 2. Register API (POST /api/users)
  describe("Register API (POST /api/users)", () => {
    it("should register a new user with valid data", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
            password: "password123"
          })
        })
      );
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual({ data: "OK" });

      // Verify db insertion
      const [dbUser] = await db.select().from(users).where(eq(users.email, "john@example.com"));
      expect(dbUser).toBeDefined();
      expect(dbUser.name).toBe("John Doe");
    });

    it("should fail to register if email is already registered", async () => {
      // Setup existing user
      const hashedPassword = await bcrypt.hash("password123", 10);
      await db.insert(users).values({
        name: "John Doe",
        email: "john@example.com",
        password: hashedPassword
      });

      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Jane Doe",
            email: "john@example.com",
            password: "password456"
          })
        })
      );
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({ error: "email sudah terdaftar" });
    });

    it("should fail to register if email format is invalid", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "email-tanpa-domain",
            password: "password123"
          })
        })
      );
      expect([400, 422]).toContain(response.status);
    });

    it("should fail to register if mandatory field is missing or empty", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            // email is missing
            password: "password123"
          })
        })
      );
      expect([400, 422]).toContain(response.status);
    });

    it("should fail to register if input exceeds maximum character limit", async () => {
      const longName = "A".repeat(256);
      const response = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: longName,
            email: "john@example.com",
            password: "password123"
          })
        })
      );
      expect([400, 422]).toContain(response.status);
    });
  });

  // 3. Login API (POST /api/users/login)
  describe("Login API (POST /api/users/login)", () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      await db.insert(users).values({
        name: "John Doe",
        email: "john@example.com",
        password: hashedPassword
      });
    });

    it("should login successfully with valid credentials and return token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "john@example.com",
            password: "password123"
          })
        })
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toBeDefined();
      expect(typeof body.data).toBe("string");
    });

    it("should fail to login if password is incorrect", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "john@example.com",
            password: "wrongpassword"
          })
        })
      );
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ data: "email atau password salah" });
    });

    it("should fail to login if email is not registered", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "unregistered@example.com",
            password: "password123"
          })
        })
      );
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ data: "email atau password salah" });
    });

    it("should fail to login if payload body is incomplete (e.g. missing password)", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "john@example.com"
            // password is missing
          })
        })
      );
      expect([400, 422]).toContain(response.status);
    });
  });

  // 4. Get Current User API (GET /api/users/current)
  describe("Get Current User API (GET /api/users/current)", () => {
    let validToken = "valid-session-token";
    
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      await db.insert(users).values({
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password: hashedPassword
      });
      await db.insert(sessions).values({
        token: validToken,
        userId: 1
      });
    });

    it("should get current user details with a valid bearer token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${validToken}`
          }
        })
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toBeDefined();
      expect(body.data.email).toBe("john@example.com");
      expect(body.data.name).toBe("John Doe");
    });

    it("should fail to get current user if Authorization header is missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET"
        })
      );
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "unauthorized" });
    });

    it("should fail to get current user if bearer token is invalid/wrong", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/current", {
          method: "GET",
          headers: {
            Authorization: "Bearer wrong-token"
          }
        })
      );
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "unauthorized" });
    });
  });

  // 5. Logout API (DELETE /api/users/logout)
  describe("Logout API (DELETE /api/users/logout)", () => {
    let validToken = "logout-session-token";

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      await db.insert(users).values({
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password: hashedPassword
      });
      await db.insert(sessions).values({
        token: validToken,
        userId: 1
      });
    });

    it("should logout successfully with a valid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${validToken}`
          }
        })
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ data: "OK" });

      // Verify session is deleted
      const sessionList = await db.select().from(sessions).where(eq(sessions.token, validToken));
      expect(sessionList.length).toBe(0);
    });

    it("should fail to logout if Authorization header is missing", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE"
        })
      );
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "unauthorized" });
    });

    it("should fail to logout if token is incorrect/inactive", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: "Bearer wrong-token"
          }
        })
      );
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "unauthorized" });
    });
  });

  // 6. Get All Users API (GET /users)
  describe("Get All Users API (GET /users)", () => {
    it("should return all users when data exists in database", async () => {
      await db.insert(users).values([
        { id: 1, name: "User One", email: "one@example.com", password: "pwd" },
        { id: 2, name: "User Two", email: "two@example.com", password: "pwd" }
      ]);

      const response = await app.handle(
        new Request("http://localhost/users")
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].email).toBe("one@example.com");
      expect(body.data[1].email).toBe("two@example.com");
    });

    it("should return empty array when database is empty", async () => {
      const response = await app.handle(
        new Request("http://localhost/users")
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });
  });

  // 7. Get User by ID API (GET /users/:id)
  describe("Get User by ID API (GET /users/:id)", () => {
    beforeEach(async () => {
      await db.insert(users).values({
        id: 10,
        name: "Target User",
        email: "target@example.com",
        password: "pwd"
      });
    });

    it("should return user details if ID exists", async () => {
      const response = await app.handle(
        new Request("http://localhost/users/10")
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(10);
      expect(body.data.name).toBe("Target User");
    });

    it("should return not found if ID does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/users/999")
      );
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.message).toBe("User not found");
    });

    it("should return bad request/error if ID is not numeric", async () => {
      const response = await app.handle(
        new Request("http://localhost/users/not-a-number")
      );
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });
  });

  // 8. Delete User API (DELETE /users/:id)
  describe("Delete User API (DELETE /users/:id)", () => {
    beforeEach(async () => {
      await db.insert(users).values({
        id: 10,
        name: "Target User",
        email: "target@example.com",
        password: "pwd"
      });
    });

    it("should delete user if ID is valid and exists", async () => {
      const response = await app.handle(
        new Request("http://localhost/users/10", {
          method: "DELETE"
        })
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.message).toContain("deleted successfully");

      // Verify db
      const userList = await db.select().from(users).where(eq(users.id, 10));
      expect(userList.length).toBe(0);
    });

    it("should return not found error if ID does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/users/999", {
          method: "DELETE"
        })
      );
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.message).toBe("User not found");
    });
  });
});
