import type { FastifyPluginAsync } from "fastify";
import authRoutes from "./auth/routes.js";
import eventsRoutes from "./events/index.js";

const v1Routes: FastifyPluginAsync = async (app) => {
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(eventsRoutes);
};

export default v1Routes;
