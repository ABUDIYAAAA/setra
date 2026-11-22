import { serve } from '@hono/node-server';
import { env } from './src/config/env.js';
import { createApp } from './src/app.js';

const app = createApp();

console.log(`🚀 Starting Setra Backend on http://${env.HOST}:${env.PORT}`);

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
    hostname: env.HOST,
  },
  (info) => {
    console.log(`✅ Server is running on http://${info.address}:${info.port}`);
    console.log(`📖 Scalar API Docs available at http://${info.address}:${info.port}/docs`);
    console.log(`📄 OpenAPI specification available at http://${info.address}:${info.port}/openapi.json`);
  }
);
