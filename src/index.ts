import { Elysia, t } from "elysia";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { usersRoute } from "./routes/users-route";

const app = new Elysia()
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
      .get("/:id", async ({ params: { id } }) => {
        try {
          const userList = await db.select().from(users).where(eq(users.id, Number(id)));
          if (userList.length === 0) {
            return { success: false, message: "User not found" };
          }
          return { success: true, data: userList[0] };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      })

      // Delete user
      .delete("/:id", async ({ params: { id } }) => {
        try {
          await db.delete(users).where(eq(users.id, Number(id)));
          return { success: true, message: `User with ID ${id} deleted successfully` };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      })
  )

  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
