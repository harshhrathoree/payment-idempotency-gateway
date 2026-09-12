import app from "./app.js";
import { env } from "./config/env.js";
import {
  checkPostgresConnection,
  checkRedisConnection,
} from "./config/check-connections.js";
import { logger } from "./config/logger.js";

async function startServer() {
  try {
    await checkPostgresConnection();
    await checkRedisConnection();

    app.listen(env.port, () => {
      logger.info(
        { port: env.port },
        "Server started"
      );
    });
  } catch (error) {
    logger.error(
      { error },
      "Failed to start server"
    );

    process.exit(1);
  }
}

startServer();