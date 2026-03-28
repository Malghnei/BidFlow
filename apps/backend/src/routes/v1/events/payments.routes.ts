import type { FastifyPluginAsync } from "fastify";

const paymentsRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/events/:id/bidders/:bidderId/holds",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement bidder holds lookup" };
    },
  );

  app.post(
    "/events/:id/checkout/capture-all",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement capture all checkout" };
    },
  );

  app.post(
    "/events/:id/checkout/bidder/:bidderId/capture",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement bidder capture" };
    },
  );

  app.post(
    "/events/:id/checkout/bidder/:bidderId/manual-pay",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement manual pay checkout" };
    },
  );

  app.get(
    "/events/:id/checkout/summary",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement checkout summary" };
    },
  );
};

export default paymentsRoutes;
