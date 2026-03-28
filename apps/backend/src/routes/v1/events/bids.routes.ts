import type { FastifyPluginAsync } from "fastify";

const bidsRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/events/:id/items/:itemId/bids",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement place individual bid" };
    },
  );

  app.get(
    "/events/:id/items/:itemId/bids",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement list bid history" };
    },
  );
};

export default bidsRoutes;
