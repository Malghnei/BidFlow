import type { FastifyPluginAsync } from "fastify";

const biddersRoutes: FastifyPluginAsync = async (app) => {
  app.post("/events/:id/bidders", { preHandler: [app.authenticate] }, async () => {
    return { message: "TODO: implement register bidder" };
  });

  app.get(
    "/events/:id/bidders/:bidderId",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement get bidder details" };
    },
  );

  app.patch(
    "/events/:id/bidders/:bidderId",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement update bidder profile" };
    },
  );

  app.post(
    "/events/:id/bidders/:bidderId/link-payment",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement link payment method" };
    },
  );

  app.get(
    "/events/:id/bidders/:bidderId/qr",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement bidder QR retrieval" };
    },
  );
};

export default biddersRoutes;
