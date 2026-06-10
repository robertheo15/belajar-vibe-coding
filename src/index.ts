import { Elysia, t } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { usersRoute } from "./routes/users-route";
import { swagger } from "@elysiajs/swagger";

export const app = new Elysia()
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "Belajar Part 1 API Documentation",
          version: "1.0.0",
          description: "Dokumentasi API untuk project Belajar Part 1",
        },
      },
    })
  )
  .use(usersRoute)
  // Health check endpoint
  .get("/", () => ({
    status: "ok",
    message: "Welcome to Elysia + Drizzle + MySQL API"
  }))

  // Grouped user routes
  .group("/users", (app) =>
    app
      // Get all users
      .get("/", async () => {
        try {
          const allUsers = await db.select().from(users);
          return { success: true, data: allUsers };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      })

      // Get user by ID
      .get("/:id", async ({ params: { id }, set }) => {
        try {
          const numericId = Number(id);
          if (isNaN(numericId)) {
            set.status = 400;
            return { success: false, error: "Invalid ID parameter" };
          }
          const userList = await db.select().from(users).where(eq(users.id, numericId));
          if (userList.length === 0) {
            set.status = 404;
            return { success: false, message: "User not found" };
          }
          return { success: true, data: userList[0] };
        } catch (error: any) {
          set.status = 500;
          return { success: false, error: error.message };
        }
      })

      // Delete user
      .delete("/:id", async ({ params: { id }, set }) => {
        try {
          const numericId = Number(id);
          if (isNaN(numericId)) {
            set.status = 400;
            return { success: false, error: "Invalid ID parameter" };
          }
          const userList = await db.select().from(users).where(eq(users.id, numericId));
          if (userList.length === 0) {
            set.status = 404;
            return { success: false, message: "User not found" };
          }
          await db.delete(users).where(eq(users.id, numericId));
          return { success: true, message: `User with ID ${id} deleted successfully` };
        } catch (error: any) {
          set.status = 500;
          return { success: false, error: error.message };
        }
      })
  )

  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
