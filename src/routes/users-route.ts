import { Elysia, t } from "elysia";
import { registerUser, loginUser, getCurrentUser, logout } from "../services/users-service";


export const usersRoute = new Elysia({ prefix: "/api" })
  .post("/users", async ({ body, set }) => {
    try {
      const result = await registerUser(body);
      set.status = 201;
      return { data: result };
    } catch (error: any) {
      if (error.message === "email sudah terdaftar") {
        set.status = 400;
        return { error: error.message };
      }
      console.error("Error during registration:", error);
      set.status = 500;
      return { error: "Internal Server Error", detail: error.message };
    }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String({ format: 'email' }),
      password: t.String(),
    })
  })
  .post("/users/login", async ({ body, set }) => {
    try {
      const token = await loginUser(body);
      set.status = 200;
      return { data: token };
    } catch (error: any) {
      if (error.message === "email atau password salah") {
        set.status = 401;
        return { data: error.message };
      }
      console.error("Error during login:", error);
      set.status = 500;
      return { data: "Internal Server Error" };
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String(),
    })
  })
  .get("/users/current", async ({ headers, set }) => {
    try {
      const authHeader = headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "unauthorized" };
      }
      const token = authHeader.substring(7);
      const user = await getCurrentUser(token);
      set.status = 200;
      return { data: user };
    } catch (error: any) {
      if (error.message === "unauthorized") {
        set.status = 401;
        return { error: "unauthorized" };
      }
      console.error("Error fetching current user:", error);
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  })
  .delete("/users/logout", async ({ headers, set }) => {
    try {
      const authHeader = headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "unauthorized" };
      }
      const token = authHeader.substring(7);
      const result = await logout(token);
      set.status = 200;
      return { data: result };
    } catch (error: any) {
      if (error.message === "unauthorized") {
        set.status = 401;
        return { error: "unauthorized" };
      }
      console.error("Error during logout:", error);
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  });
