const http = require('http');
const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const { initSocket } = require('./realtime/socket');

(async () => {
  try {
    await connectDB();
    const server = http.createServer(app);
    initSocket(server); // attach Socket.IO (JWT-authenticated live location + alerts)
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`✗ Port ${env.port} is already in use. Stop the old server or run "npm run free-port".`);
        process.exit(1);
      }
      console.error('✗ Server error:', err.message);
      process.exit(1);
    });
    server.listen(env.port, () => {
      console.log(`✓ Badbaado API running on :${env.port} [${env.nodeEnv}]`);
      console.log(`  REST  http://localhost:${env.port}/api/v1`);
      console.log(`  WS    ws://localhost:${env.port}`);
    });
  } catch (err) {
    console.error('✗ Startup failed:', err.message);
    process.exit(1);
  }
})();
