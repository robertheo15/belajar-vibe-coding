import { Elysia, t } from "elysia";
import { registerUser, loginUser } from "../services/users-service";

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
  });
