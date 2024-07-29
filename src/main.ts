import { withPermitMiddleware } from './middleware/auth.middleware';
import fastifyCron from 'fastify-cron';
import { syncData } from './cronjob/sync-data';
import 'dotenv/config';
import './config/init-sentry';
import * as Sentry from '@sentry/node';
import Fastify, { type FastifyInstance } from 'fastify';
import { registerRoutes } from './router';

const server: FastifyInstance = Fastify({
  logger: {
    level: 'info',
  },
});

// Setup sentry
Sentry.setupFastifyErrorHandler(server);

// Register Middleware Here
server.addHook('preHandler', withPermitMiddleware);

// Register Service Here
// Cronjob
server.register(fastifyCron, {
  jobs: [
    {
      cronTime: '* * * * *',
      onTick: syncData,
    },
  ],
});

// REST API
registerRoutes(server);

// Run fastify
const start = async () => {
  try {
    await server.listen({ port: 3000 });
    server.cron.startAllJobs();
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
