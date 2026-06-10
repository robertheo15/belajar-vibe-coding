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
      name: t.String({ maxLength: 255, default: "John Doe" }),
      email: t.String({ format: 'email', maxLength: 255, default: "johndoe@example.com" }),
      password: t.String({ maxLength: 255, default: "password123" }),
    }),
    response: {
      201: t.Object({
        data: t.Object({
          id: t.Numeric({ default: 1 }),
          name: t.String({ default: "John Doe" }),
          email: t.String({ default: "johndoe@example.com" }),
          createdAt: t.Nullable(t.String({ default: "2026-06-10T02:00:00.000Z" }))
        })
      }),
      400: t.Object({
        error: t.String({ default: "email sudah terdaftar" })
      }),
      500: t.Object({
        error: t.String({ default: "Internal Server Error" }),
        detail: t.Optional(t.String({ default: "Error details here" }))
      })
    },
    detail: {
      summary: "Registrasi user baru",
      tags: ["Authentication"]
    }
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
      email: t.String({ format: 'email', default: "johndoe@example.com" }),
      password: t.String({ default: "password123" }),
    }),
    response: {
      200: t.Object({
        data: t.String({ default: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
      }),
      401: t.Object({
        data: t.String({ default: "email atau password salah" })
      }),
      500: t.Object({
        data: t.String({ default: "Internal Server Error" })
      })
    },
    detail: {
      summary: "Login user untuk mendapatkan token sesi",
      tags: ["Authentication"]
    }
  })
  .group("/users", (app) =>
    app
      .derive(({ headers }) => {
        const authHeader = headers["authorization"];
        const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
        return { token };
      })
      .onBeforeHandle(({ token, set }) => {
        if (!token) {
          set.status = 401;
          return { error: "unauthorized" };
        }
      })
      .get("/current", async ({ token, set }) => {
        try {
          const user = await getCurrentUser(token!);
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
      }, {
        headers: t.Object({
          authorization: t.String({ default: "Bearer token_kamu" })
        }),
        response: {
          200: t.Object({
            data: t.Object({
              id: t.Numeric({ default: 1 }),
              name: t.String({ default: "John Doe" }),
              email: t.String({ default: "johndoe@example.com" }),
              createdAt: t.Nullable(t.String({ default: "2026-06-10T02:00:00.000Z" }))
            })
          }),
          401: t.Object({
            error: t.String({ default: "unauthorized" })
          }),
          500: t.Object({
            error: t.String({ default: "Internal Server Error" })
          })
        },
        detail: {
          summary: "Mendapatkan data user yang sedang login",
          tags: ["User Profile"]
        }
      })
      .delete("/logout", async ({ token, set }) => {
        try {
          const result = await logout(token!);
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
      }, {
        headers: t.Object({
          authorization: t.String({ default: "Bearer token_kamu" })
        }),
        response: {
          200: t.Object({
            data: t.String({ default: "logout sukses" })
          }),
          401: t.Object({
            error: t.String({ default: "unauthorized" })
          }),
          500: t.Object({
            error: t.String({ default: "Internal Server Error" })
          })
        },
        detail: {
          summary: "Logout user dan menghapus token sesi",
          tags: ["Authentication"]
        }
      })
  );
