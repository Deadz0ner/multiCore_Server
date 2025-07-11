const { Queue } = require('bullmq');
const { redis } = require('../config');
const logger = require('../logger');

// Create Redis connection configuration
const redisConfig = {
  host: redis.host,
  port: redis.port,
  password: redis.password,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

// Create the main job queue
const dummyJobQueue = new Queue('dummy-jobs', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 10,
    removeOnFail: 5,
  },
});

// Create Dead Letter Queue for failed jobs
const deadLetterQueue = new Queue('dead-letter-queue', {
  connection: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: false, // Keep failed jobs in DLQ
  },
});

// Add a dummy job to the queue
async function addDummyJob(data) {
  try {
    const job = await dummyJobQueue.add('process-dummy-data', data, {
      priority: 1,
      delay: 0,
    });
    
    logger.info(`Job added to queue: ${job.id}`);
    return job;
  } catch (error) {
    logger.error('Failed to add job to queue:', error);
    throw error;
  }
}

// Move failed job to Dead Letter Queue
async function moveToDeadLetterQueue(jobData, error) {
  try {
    await deadLetterQueue.add('failed-job', {
      originalJob: jobData,
      error: error.message,
      timestamp: new Date().toISOString(),
      failureReason: 'Max retries exceeded',
    });
    
    logger.info('Job moved to Dead Letter Queue');
  } catch (dlqError) {
    logger.error('Failed to move job to DLQ:', dlqError);
  }
}

// Get queue statistics
async function getQueueStats() {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      dummyJobQueue.getWaiting(),
      dummyJobQueue.getActive(),
      dummyJobQueue.getCompleted(),
      dummyJobQueue.getFailed(),
    ]);

    const dlqStats = await deadLetterQueue.getWaiting();

    return {
      mainQueue: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      },
      deadLetterQueue: {
        count: dlqStats.length,
      },
    };
  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    throw error;
  }
}

module.exports = {
  dummyJobQueue,
  deadLetterQueue,
  addDummyJob,
  moveToDeadLetterQueue,
  getQueueStats,
};
