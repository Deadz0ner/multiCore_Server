const cluster = require('cluster');
const os = require('os');
const app = require('./app');
const logger = require('./logger');
const { port } = require('./config');

const numCPUs = os.cpus().length;

function startWorker() {
  app.listen(port, () => {
    logger.info(`Worker ${process.pid} started on port ${port}`);
  });
}

if (cluster.isMaster) {
  logger.info(`Master ${process.pid} is running`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code, signal) => {
    logger.error(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info(`Worker ${process.pid} shutting down...`);
    process.exit(0);
  });
  startWorker();
}
