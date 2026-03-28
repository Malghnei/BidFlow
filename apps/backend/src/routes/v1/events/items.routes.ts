import type { FastifyPluginAsync } from "fastify";

const itemsRoutes: FastifyPluginAsync = async (app) => {
  app.post("/events/:id/items", { preHandler: [app.authenticate] }, async () => {
    return { message: "TODO: implement create item" };
  });

  app.get("/events/:id/items", { preHandler: [app.authenticate] }, async () => {
    return { message: "TODO: implement list items" };
  });

  app.patch(
    "/events/:id/items/:itemId",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement update item details" };
    },
  );

  app.post(
    "/events/:id/items/:itemId/open",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement open item bidding" };
    },
  );

  app.post(
    "/events/:id/items/:itemId/close",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement close item bidding" };
    },
  );
};

export default itemsRoutes;
