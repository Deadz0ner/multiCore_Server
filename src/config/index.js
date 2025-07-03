require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  logDir: process.env.LOG_DIR || 'logs',
  nodeEnv: process.env.NODE_ENV || 'development',
};
