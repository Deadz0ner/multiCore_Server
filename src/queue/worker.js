const { Worker } = require('bullmq');
const { redis } = require('../config');
const logger = require('../logger');
const { moveToDeadLetterQueue } = require('./index');

// Redis connection configuration
const redisConfig = {
  host: redis.host,
  port: redis.port,
  password: redis.password,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

// Create worker for processing dummy jobs
const dummyJobWorker = new Worker('dummy-jobs', async (job) => {
  logger.info(`Processing job ${job.id} with data:`, job.data);
  
  try {
    // Simulate some processing work
    const { message, shouldFail } = job.data;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate random failures for testing DLQ
    if (shouldFail || Math.random() < 0.1) {
      throw new Error('Simulated job failure');
    }
    
    // Process the dummy data
    const result = {
      processedMessage: `Processed: ${message}`,
      processedAt: new Date().toISOString(),
      workerPID: process.pid,
    };
    
    logger.info(`Job ${job.id} completed successfully`);
    return result;
    
  } catch (error) {
    logger.error(`Job ${job.id} failed:`, error.message);
    
    // If this is the final attempt, move to DLQ
    if (job.attemptsMade >= job.opts.attempts) {
      await moveToDeadLetterQueue(job.data, error);
    }
    
    throw error;
  }
}, {
  connection: redisConfig,
  concurrency: 5, // Process up to 5 jobs concurrently
});

// Worker event handlers
dummyJobWorker.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed with result:`, result);
});

dummyJobWorker.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
});

dummyJobWorker.on('error', (err) => {
  logger.error('Worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Worker shutting down...');
  await dummyJobWorker.close();
  process.exit(0);
});

logger.info(`Dummy job worker started with PID: ${process.pid}`);

module.exports = dummyJobWorker;
