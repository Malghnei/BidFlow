import type { FastifyPluginAsync } from "fastify";

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/join", async () => {
    return { message: "TODO: implement /auth/join" };
  });

  app.post("/admin/login", async () => {
    return { message: "TODO: implement /auth/admin/login" };
  });

  app.post("/refresh", async () => {
    return { message: "TODO: implement /auth/refresh" };
  });
};

export default authRoutes;
