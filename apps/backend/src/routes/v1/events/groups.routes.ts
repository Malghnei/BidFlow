import type { FastifyPluginAsync } from "fastify";

const groupsRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/events/:id/items/:itemId/groups",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement create group" };
    },
  );

  app.post(
    "/events/:id/groups/:groupId/join",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement join group" };
    },
  );

  app.post(
    "/events/:id/groups/:groupId/add-member",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement add member to group" };
    },
  );

  app.patch(
    "/events/:id/groups/:groupId/members/:bidderId",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement update contribution" };
    },
  );

  app.post(
    "/events/:id/groups/:groupId/merge",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement merge groups" };
    },
  );

  app.get(
    "/events/:id/groups/:groupId",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement get group details" };
    },
  );

  app.delete(
    "/events/:id/groups/:groupId/members/:bidderId",
    { preHandler: [app.authenticate] },
    async () => {
      return { message: "TODO: implement leave group" };
    },
  );
};

export default groupsRoutes;
