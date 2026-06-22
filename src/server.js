import app from './app.js';
import { connectDatabase } from './config/database.js';
import { config } from './config/index.js';

async function bootstrap() {
  await connectDatabase();

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
    console.log(`Webhook URL: ${config.serverUrl}/webhook/whatsapp`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
