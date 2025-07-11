require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  logDir: process.env.LOG_DIR || 'logs',
  nodeEnv: process.env.NODE_ENV || 'development',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  }
};
