import { app } from "./app.ts";
import { env } from "./config/envs.ts";

function main() {
  app.listen({ host: "0.0.0.0", port: env.PORT });
}

main();
