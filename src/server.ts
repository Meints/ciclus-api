import "dotenv/config";
import { buildApp } from "./app";
import { env } from "./config/env";
import { registerJobs } from "./jobs/index";

const app = buildApp();

registerJobs();

app.listen({ port: env.PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
