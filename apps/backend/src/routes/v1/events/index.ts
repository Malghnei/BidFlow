import type { FastifyPluginAsync } from "fastify";
import biddersRoutes from "./bidders.routes.js";
import itemsRoutes from "./items.routes.js";
import bidsRoutes from "./bids.routes.js";
import groupsRoutes from "./groups.routes.js";
import paymentsRoutes from "./payments.routes.js";

const eventsRoutes: FastifyPluginAsync = async (app) => {
  await app.register(biddersRoutes);
  await app.register(itemsRoutes);
  await app.register(bidsRoutes);
  await app.register(groupsRoutes);
  await app.register(paymentsRoutes);
};

export default eventsRoutes;
