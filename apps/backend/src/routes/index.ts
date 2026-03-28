import type { FastifyPluginAsync } from "fastify";
import v1Routes from "./v1/index.js";

const routes: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => ({ status: "ok" }));
  await app.register(v1Routes, { prefix: "/v1" });
};

export default routes;
