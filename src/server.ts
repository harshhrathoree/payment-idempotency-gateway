import app from "./app.js";
import { env } from "./config/env.js";
import {
  checkPostgresConnection,
  checkRedisConnection,
} from "./config/check-connections.js";

async function startServer() {
  try {
    await checkPostgresConnection();
    await checkRedisConnection();

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);

    process.exit(1);
  }
}

startServer();