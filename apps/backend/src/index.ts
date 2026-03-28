import { buildApp } from "./app.js";
import { connectMongo } from "./db/mongoose.js";
import "./db/models/index.js";
import { env } from "./config/env.js";

async function bootstrap() {
  await connectMongo();
  const app = buildApp();

  await app.listen({
    host: "0.0.0.0",
    port: env.port,
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
